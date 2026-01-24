#import <Cocoa/Cocoa.h>

#include "utils.hpp"
#include "plugin_settings.hpp"
#include "log.hpp"
#include "plugin.hpp"

using namespace msrv;
using namespace msrv::player_foobar2000;

const CGFloat margin = 20;

@interface MainPrefsPageInstance : NSViewController<NSTableViewDelegate, NSTableViewDataSource>
    @property(strong, nonatomic) NSTextField* portText;
    @property(strong, nonatomic) NSButton* allowRemoteButton;
    @property(strong, nonatomic) NSTableView* musicDirsTable;
    @property(strong, nonatomic) NSButton* authRequiredButton;
    @property(strong, nonatomic) NSTextField* authUserText;
    @property(strong, nonatomic) NSSecureTextField* authPasswordText;
    @property(strong, nonatomic) NSMutableArray* musicDirs;
@end

@implementation MainPrefsPageInstance

- (void)authRequiredDidChange:(id)sender
{
    int enabled = self.authRequiredButton.state != 0;
    self.authUserText.enabled = enabled;
    self.authPasswordText.enabled = enabled;
}

- (void)musicDirAdd:(id)sender
{
}

- (void)musicDirRemove:(id)sender
{
}

- (void)musicDirUp:(id)sender
{
}

- (void)musicDirDown:(id)sender
{
}

- (NSInteger)numberOfRowsInTableView:(NSTableView*)tableView
{
    logDebug("numberOfRowsInTableView: %i", static_cast<int>(self.musicDirs.count));
    return self.musicDirs.count;
}

- (NSView*)tableView:(NSTableView*)tableView viewForTableColumn:(NSTableColumn*)tableColumn row:(NSInteger)row
{
    NSString* dir = self.musicDirs[row];
    NSString* columnId = [tableColumn identifier];

    NSTableCellView* cellView = [tableView makeViewWithIdentifier:columnId owner:self];

    if (cellView == nil)
    {
        cellView = [[NSTableCellView alloc] initWithFrame:NSMakeRect(0, 0, tableColumn.width, 20)];
        cellView.identifier = columnId;

        NSTextField* textField = [[NSTextField alloc] initWithFrame:cellView.bounds];
        textField.editable = NO;
        textField.bezeled = NO;
        textField.drawsBackground = NO;
 
        cellView.textField = textField;
        [cellView addSubview:textField];
    }

    cellView.textField.stringValue = dir;
    return cellView;
}

- (NSBox*)newSeparator
{
    NSBox* box = [NSBox new];
    box.boxType = NSBoxSeparator;

    [NSLayoutConstraint activateConstraints:@[
        [box.heightAnchor constraintEqualToConstant:50],
    ]];

    return box;
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    self.portText = [NSTextField textFieldWithString:@""];
    NSNumberFormatter* numberFormatter = [NSNumberFormatter new];
    numberFormatter.numberStyle = NSNumberFormatterDecimalStyle;
    numberFormatter.allowsFloats = NO;
    numberFormatter.usesGroupingSeparator = NO;
    numberFormatter.minimum = @0;
    numberFormatter.maximum = @65535;
    self.portText.formatter = numberFormatter;

    [NSLayoutConstraint activateConstraints:@[
        [self.portText.widthAnchor constraintEqualToConstant:100],
    ]];

    self.allowRemoteButton = [NSButton checkboxWithTitle:@"Allow remote connections" target:nil action:nil];

    self.musicDirsTable = [NSTableView new];
    self.musicDirsTable.delegate = self;
    self.musicDirsTable.dataSource = self;
    self.musicDirsTable.headerView = nil;

    NSTableColumn* dirColumn = [[NSTableColumn alloc] initWithIdentifier:@"MusicDir"];
    [self.musicDirsTable addTableColumn:dirColumn];

    NSScrollView* musicDirsScroll = [NSScrollView new];
    musicDirsScroll.hasVerticalScroller = YES;
    musicDirsScroll.documentView = self.musicDirsTable;

    [NSLayoutConstraint activateConstraints:@[
        [musicDirsScroll.heightAnchor constraintEqualToConstant:200]
    ]];

    self.authRequiredButton = [
        NSButton checkboxWithTitle:@"Require authentication"
                 target:self
                 action:@selector(authRequiredDidChange:)
    ];

    self.authUserText = [NSTextField textFieldWithString:@""];
    self.authPasswordText = [NSSecureTextField new];

    NSStackView* musicDirsButtons = [NSStackView stackViewWithViews:@[
        [NSButton
            buttonWithTitle:@"Add..."
            target:self
            action:@selector(musicDirAdd:)
        ],
        [NSButton
            buttonWithTitle:@"Remove"
            target:self
            action:@selector(musicDirRemove:)
        ],
        [NSButton
            buttonWithTitle:@"Move up"
            target:self
            action:@selector(musicDirUp:)
        ],
        [NSButton
            buttonWithTitle:@"Move down"
            target:self
            action:@selector(musicDirDown:)
        ]
    ]];

    NSStackView* stack = [NSStackView stackViewWithViews:@[
        [NSTextField labelWithString:@"Port for HTTP connections:"],
        self.portText,
        self.allowRemoteButton,

        [NSTextField labelWithString:@"Browseable music directories:"],
        musicDirsScroll,
        musicDirsButtons,

        self.authRequiredButton,
        [NSTextField labelWithString:@"User:"],
        self.authUserText,
        [NSTextField labelWithString:@"Password:"],
        self.authPasswordText,
    ]];

    stack.alignment = NSLayoutAttributeLeading;
    stack.orientation = NSUserInterfaceLayoutOrientationVertical;
    [self.view addSubview:stack];

    [NSLayoutConstraint activateConstraints:@[
        [stack.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor constant:margin],
        [stack.topAnchor constraintEqualToAnchor:self.view.topAnchor constant:margin],
        [stack.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor constant:-margin],
        [stack.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor constant:-margin],
    ]];
}

- (void)loadMusicDirs
{
    auto cppDirs = settings_store::getMusicDirs();

    for (int i = 0; i < 20; i++)
        cppDirs.emplace_back("/Users/user/Music");

    NSMutableArray* nsDirs = [NSMutableArray arrayWithCapacity:cppDirs.size()];

    for (const auto& dir : cppDirs)
    {
        [nsDirs addObject:[NSString stringWithUTF8String:dir.c_str()]];
    }

    self.musicDirs = nsDirs;
}

- (void)saveMusicDirs
{
    NSMutableArray* nsDirs = self.musicDirs;
    std::vector<std::string> cppDirs;
    cppDirs.reserve(nsDirs.count);

    for (NSString* dir in nsDirs)
    {
        cppDirs.emplace_back([dir UTF8String]);
    }

    settings_store::setMusicDirs(cppDirs);
}

- (void)viewWillAppear
{
    [super viewWillAppear];

    auto authUser = settings_store::authUser.get_value();
    auto authPassword = settings_store::authPassword.get_value();

    self.portText.integerValue = (int)settings_store::port;
    self.allowRemoteButton.state = settings_store::allowRemote ? 1 : 0;
    self.authRequiredButton.state = settings_store::authRequired ? 1 : 0;
    self.authUserText.stringValue = [NSString stringWithUTF8String:authUser.c_str()];
    self.authPasswordText.stringValue = [NSString stringWithUTF8String:authPassword.c_str()];

    [self loadMusicDirs];
    [self.musicDirsTable reloadData];
}

- (void)viewWillDisappear
{
    [super viewWillDisappear];

    return;

    settings_store::port = self.portText.integerValue;
    settings_store::allowRemote = self.allowRemoteButton.state != 0;
    settings_store::authRequired = self.authRequiredButton.state != 0;
    settings_store::authUser = [self.authUserText.stringValue UTF8String];
    settings_store::authPassword = [self.authPasswordText.stringValue UTF8String];

    [self saveMusicDirs];

    auto plugin = Plugin::current();

    if (plugin)
        plugin->reconfigure();
}

@end

namespace {

class MainPrefsPage : public preferences_page_v3
{
public:
    MainPrefsPage() = default;
    ~MainPrefsPage() = default;

    const char* get_name() override
    {
        return MSRV_PROJECT_NAME;
    }

    GUID get_guid() override
    {
        return prefs_pages::main;
    }

    GUID get_parent_guid() override
    {
        return preferences_page::guid_tools;
    }

    bool get_help_url(pfc::string_base& p_out) override
    {
        return false;
    }

    double get_sort_priority() override
    {
        return 0;
    }

    service_ptr instantiate() override
    {
        return fb2k::wrapNSObject([MainPrefsPageInstance new]);
    }
};

preferences_page_factory_t<MainPrefsPage> factory;

}
