#import <Cocoa/Cocoa.h>

#include "utils.hpp"
#include "plugin_settings.hpp"
#include "log.hpp"
#include "plugin.hpp"

using namespace msrv;
using namespace msrv::player_foobar2000;

const CGFloat margin = 10;
const CGFloat labelWidth = 75;

@interface MainPrefsPageInstance : NSViewController<NSTextFieldDelegate, NSTableViewDelegate, NSTableViewDataSource>
    @property(nonatomic) BOOL hasChanges;
    @property(nonatomic) int currentPort;

    @property(strong, nonatomic) NSTextField* portText;
    @property(strong, nonatomic) NSButton* allowRemoteButton;

    @property(strong, nonatomic) NSMutableOrderedSet* musicDirs;
    @property(strong, nonatomic) NSTableView* musicDirsTable;
    @property(strong, nonatomic) NSButton* musicDirRemoveButton;
    @property(strong, nonatomic) NSButton* musicDirUpButton;
    @property(strong, nonatomic) NSButton* musicDirDownButton;

    @property(strong, nonatomic) NSButton* authRequiredButton;
    @property(strong, nonatomic) NSTextField* authUserText;
    @property(strong, nonatomic) NSSecureTextField* authPasswordText;

    @property(strong, nonatomic) NSButton* allowChangePlaylistsButton;
    @property(strong, nonatomic) NSButton* allowChangeOutputButton;
    @property(strong, nonatomic) NSButton* allowChangeClientConfigButton;
@end

@implementation MainPrefsPageInstance

- (void)openUrl:(NSString*)url
{
    [NSWorkspace.sharedWorkspace openURL:[NSURL URLWithString:url]];
}

- (void)openGuiClicked:(id)sender
{
    NSString* url = [NSString stringWithFormat:@"http://localhost:%i", self.currentPort];
    [self openUrl:url];
}

- (void)donateLinkClicked:(id)sender
{
    [self openUrl:@(MSRV_DONATE_URL)];
}

- (void)sourcesLinkClicked:(id)sender
{
    [self openUrl:@(MSRV_PROJECT_URL)];
}

- (void)licensesLinkClicked:(id)sender
{
    NSString* url = [NSString
        stringWithFormat:@"http://localhost:%i/%s",
        self.currentPort,
        MSRV_WEBUI_LICENSES_FILE
    ];

    [self openUrl:url];
}

- (void)apiDocsLinkClicked:(id)sender
{
    [self openUrl:@(MSRV_API_DOCS_URL)];
}

- (void)controlTextDidEndEditing:(NSNotification*)notification
{
    if (notification.object == self.portText)
    {
        settings_store::port = self.portText.integerValue;
        self.hasChanges = YES;
        return;
    }

    if (notification.object == self.authUserText)
    {
        settings_store::authUser = self.authUserText.stringValue.UTF8String;
        self.hasChanges = YES;
        return;
    }

    if (notification.object == self.authPasswordText)
    {
        settings_store::authPassword = self.authPasswordText.stringValue.UTF8String;
        self.hasChanges = YES;
        return;
    }
}

- (void)allowRemoteClicked:(id)sender
{
    settings_store::allowRemote = self.allowRemoteButton.state != 0;
    self.hasChanges = YES;
}

- (void)allowChangePlaylistsClicked:(id)sender
{
    settings_store::allowChangePlaylists = self.allowChangePlaylistsButton.state != 0;
    self.hasChanges = YES;
}

- (void)allowChangeOutputClicked:(id)sender
{
    settings_store::allowChangeOutput = self.allowChangeOutputButton.state != 0;
    self.hasChanges = YES;
}

- (void)allowChangeClientConfigClicked:(id)sender
{
    settings_store::allowChangeClientConfig = self.allowChangeClientConfigButton.state != 0;
    self.hasChanges = YES;
}

- (void)authRequiredClicked:(id)sender
{
    int enabled = self.authRequiredButton.state != 0;
    self.authUserText.enabled = enabled;
    self.authPasswordText.enabled = enabled;
    settings_store::authRequired = enabled;
    self.hasChanges = YES;
}

- (void)loadMusicDirs
{
    auto cppDirs = settings_store::getMusicDirs();
    NSMutableOrderedSet* nsDirs = [NSMutableOrderedSet orderedSetWithCapacity:cppDirs.size()];

    for (const auto& dir : cppDirs)
        [nsDirs addObject:@(dir.c_str())];

    self.musicDirs = nsDirs;
}

- (void)saveMusicDirs
{
    NSMutableOrderedSet* nsDirs = self.musicDirs;
    std::vector<std::string> cppDirs;
    cppDirs.reserve(nsDirs.count);

    for (NSString* dir in nsDirs)
        cppDirs.emplace_back(dir.UTF8String);

    settings_store::setMusicDirs(cppDirs);
    self.hasChanges = YES;
}

- (void)musicDirAdd:(id)sender
{
    NSOpenPanel* panel = [NSOpenPanel openPanel];
    panel.canChooseFiles = NO;
    panel.canChooseDirectories = YES;
    panel.allowsMultipleSelection = YES;
    panel.prompt = @"Add";
    panel.message = @"Please select one or more directories:";

    [panel beginSheetModalForWindow:self.view.window completionHandler:^(NSModalResponse response)
    {
        if (response != NSModalResponseOK)
            return;

        auto dirs = self.musicDirs;
        auto startIndex = dirs.count;

        for (NSURL* url in panel.URLs)
            [dirs addObject:url.path];

        auto count = dirs.count - startIndex;
        if (count == 0)
            return;

        [self.musicDirsTable
            insertRowsAtIndexes:[NSIndexSet indexSetWithIndexesInRange:NSMakeRange(startIndex, count)]
            withAnimation:NSTableViewAnimationSlideDown
        ];

        [self saveMusicDirs];
    }];
}

- (void)musicDirRemove:(id)sender
{
    NSIndexSet* selection = self.musicDirsTable.selectedRowIndexes;

    if (selection.count == 0)
        return;

    NSAlert* alert = [NSAlert new];
    alert.messageText = @"Remove selected items?";
    alert.informativeText = @"Are you sure you want to remove selected items? This action cannot be undone.";
    alert.alertStyle = NSAlertStyleWarning;
    [alert addButtonWithTitle:@"Remove"];
    [alert addButtonWithTitle:@"Cancel"];

    [alert beginSheetModalForWindow:self.view.window completionHandler:^(NSModalResponse response)
    {
        if (response != NSAlertFirstButtonReturn)
           return;

        [self.musicDirs removeObjectsAtIndexes:selection];
        [self.musicDirsTable removeRowsAtIndexes:selection withAnimation:NSTableViewAnimationSlideUp];
        [self saveMusicDirs];
    }];
}

- (void)musicDirUp:(id)sender
{
    NSIndexSet* selection = self.musicDirsTable.selectedRowIndexes;
    BOOL allowed = selection.count == 1 && selection.firstIndex > 0;
    if (!allowed)
        return;

    auto index = selection.firstIndex;
    
    [self.musicDirs exchangeObjectAtIndex:index withObjectAtIndex:(index - 1)];

    [self.musicDirsTable
        reloadDataForRowIndexes:[NSIndexSet indexSetWithIndexesInRange:NSMakeRange(index - 1, 2)]
        columnIndexes:[NSIndexSet indexSetWithIndex:0]
    ];

    [self.musicDirsTable
        selectRowIndexes:[NSIndexSet indexSetWithIndex:(index - 1)]
        byExtendingSelection:NO
    ];

    [self saveMusicDirs];
}

- (void)musicDirDown:(id)sender
{
    NSIndexSet* selection = self.musicDirsTable.selectedRowIndexes;
    BOOL allowed = selection.count == 1 && selection.firstIndex < self.musicDirs.count - 1;
    if (!allowed)
        return;

    auto index = selection.firstIndex;

    [self.musicDirs exchangeObjectAtIndex:index withObjectAtIndex:(index + 1)];

    [self.musicDirsTable
        reloadDataForRowIndexes:[NSIndexSet indexSetWithIndexesInRange:NSMakeRange(index, 2)]
        columnIndexes:[NSIndexSet indexSetWithIndex:0]
    ];

    [self.musicDirsTable
        selectRowIndexes:[NSIndexSet indexSetWithIndex:(index + 1)]
        byExtendingSelection:NO
    ];

    [self saveMusicDirs];
}

- (NSInteger)numberOfRowsInTableView:(NSTableView*)tableView
{
    return self.musicDirs.count;
}

- (void)tableViewSelectionDidChange:(NSNotification*)notification
{
    NSIndexSet* selection = self.musicDirsTable.selectedRowIndexes;

    self.musicDirRemoveButton.enabled = selection.count > 0;
    self.musicDirUpButton.enabled = selection.count == 1 && selection.firstIndex > 0;
    self.musicDirDownButton.enabled = selection.count == 1 &&  selection.firstIndex < self.musicDirs.count - 1;
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

- (NSTextField*)headerWithTitle:(NSString*)text
{
    NSTextField* textField = [NSTextField labelWithString:text];
    textField.font = [NSFont preferredFontForTextStyle:NSFontTextStyleTitle2 options:@{}];
    return textField;
}

- (NSButton*)linkButton:(NSString*)text action:(SEL)action
{
    NSButton* button = [NSButton buttonWithTitle:text target:self action:action];

    button.bordered = NO;
    button.bezelStyle = NSBezelStyleInline;
    button.contentTintColor = NSColor.linkColor;

    [button addCursorRect:button.bounds cursor:NSCursor.pointingHandCursor];

    return button;
}

- (NSStackView*)stackViewWithLabel:(NSString*)text view:(NSView*)view
{
    NSTextField* textField = [NSTextField labelWithString:text];
    textField.alignment = NSTextAlignmentRight;

    [NSLayoutConstraint activateConstraints:@[
        [textField.widthAnchor constraintEqualToConstant:labelWidth],
    ]];

    return [NSStackView stackViewWithViews:@[textField, view]];
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
    self.portText.delegate = self;

    [NSLayoutConstraint activateConstraints:@[
        [self.portText.widthAnchor constraintEqualToConstant:100],
    ]];

    NSStackView* portRow = [self stackViewWithLabel:@"HTTP port:" view:self.portText];
    [portRow addView:[self linkButton:@"Open" action:@selector(openGuiClicked:)]
             inGravity:NSStackViewGravityLeading];

    self.allowRemoteButton = [
        NSButton
            checkboxWithTitle:@"Allow remote connections"
            target:self
            action:@selector(allowRemoteClicked:)
    ];

    NSStackView* allowRemoteRow = [self stackViewWithLabel:@"" view:self.allowRemoteButton];

    self.musicDirsTable = [NSTableView new];
    self.musicDirsTable.delegate = self;
    self.musicDirsTable.dataSource = self;
    self.musicDirsTable.headerView = nil;
    self.musicDirsTable.allowsMultipleSelection = YES;
    [self.musicDirsTable addTableColumn:[[NSTableColumn alloc] initWithIdentifier:@"MusicDir"]];

    NSScrollView* musicDirsScroll = [NSScrollView new];
    musicDirsScroll.hasVerticalScroller = YES;
    musicDirsScroll.documentView = self.musicDirsTable;

    [NSLayoutConstraint activateConstraints:@[
        [musicDirsScroll.heightAnchor constraintEqualToConstant:200]
    ]];

    self.musicDirRemoveButton = [NSButton buttonWithTitle:@"Remove" target:self action:@selector(musicDirRemove:)];
    self.musicDirUpButton = [NSButton buttonWithTitle:@"Move up" target:self action:@selector(musicDirUp:)];
    self.musicDirDownButton = [NSButton buttonWithTitle:@"Move down" target:self action:@selector(musicDirDown:)];

    self.musicDirRemoveButton.enabled = NO;
    self.musicDirUpButton.enabled = NO;
    self.musicDirDownButton.enabled = NO;

    NSStackView* musicDirsButtons = [NSStackView stackViewWithViews:@[
        [NSButton buttonWithTitle:@"Add..." target:self action:@selector(musicDirAdd:)],
        self.musicDirRemoveButton,
        self.musicDirUpButton,
        self.musicDirDownButton
    ]];

    self.authRequiredButton = [
        NSButton checkboxWithTitle:@"Require authentication"
                 target:self
                 action:@selector(authRequiredClicked:)
    ];

    NSStackView* authRequiredRow = [self stackViewWithLabel:@"" view:self.authRequiredButton];

    self.authUserText = [NSTextField textFieldWithString:@""];
    self.authUserText.delegate = self;

    [NSLayoutConstraint activateConstraints:@[
        [self.authUserText.widthAnchor constraintEqualToConstant:300],
    ]];

    NSStackView* authUserRow = [self stackViewWithLabel:@"User:" view:self.authUserText];

    self.authPasswordText = [NSSecureTextField new];
    self.authPasswordText.delegate = self;

    NSStackView* authPasswordRow = [self stackViewWithLabel:@"Password:" view:self.authPasswordText];

    [NSLayoutConstraint activateConstraints:@[
        [self.authPasswordText.widthAnchor constraintEqualToConstant:300],
    ]];

    self.allowChangePlaylistsButton = [
        NSButton checkboxWithTitle:@"Changing playlists"
                 target:self
                 action:@selector(allowChangePlaylistsClicked:)
    ];

    self.allowChangeOutputButton = [
        NSButton checkboxWithTitle:@"Changing output device"
                 target:self
                 action:@selector(allowChangeOutputClicked:)
    ];

    self.allowChangeClientConfigButton = [
        NSButton checkboxWithTitle:@"Changing default web interface configuration"
                 target:self
                 action:@selector(allowChangeClientConfigClicked:)
    ];

    NSStackView* links = [NSStackView stackViewWithViews:@[
        [self linkButton:@"Donate to author" action:@selector(donateLinkClicked:)],
        [self linkButton:@"GitHub" action:@selector(sourcesLinkClicked:)],
        [self linkButton:@"Third-party licenses" action:@selector(licensesLinkClicked:)],
        [self linkButton:@"API documentation" action:@selector(apiDocsLinkClicked:)],
    ]];

    NSTextField* networkHeader = [self headerWithTitle:@"Network"];
    NSTextField* musicDirsHeader = [self headerWithTitle:@"Browseable music directories"];
    NSTextField* authenticationHeader = [self headerWithTitle:@"Authentication"];
    NSTextField* permissionsHeader = [self headerWithTitle:@"Operations that are allowed via web interface and HTTP API"];

    NSStackView* stack = [NSStackView stackViewWithViews:@[
        networkHeader,
        portRow,
        allowRemoteRow,
        musicDirsHeader,
        musicDirsScroll,
        musicDirsButtons,
        authenticationHeader,
        authRequiredRow,
        authUserRow,
        authPasswordRow,
        permissionsHeader,
        self.allowChangePlaylistsButton,
        self.allowChangeOutputButton,
        self.allowChangeClientConfigButton,
        links,
    ]];

    stack.alignment = NSLayoutAttributeLeading;
    stack.orientation = NSUserInterfaceLayoutOrientationVertical;

    [stack setCustomSpacing:(margin*2) afterView:allowRemoteRow];
    [stack setCustomSpacing:margin afterView:musicDirsHeader];

    [stack setCustomSpacing:(margin*2) afterView:musicDirsButtons];
    [stack setCustomSpacing:margin afterView:authenticationHeader];

    [stack setCustomSpacing:(margin*2) afterView:authPasswordRow];
    [stack setCustomSpacing:margin afterView:permissionsHeader];

    [stack setCustomSpacing:(margin*2) afterView:self.allowChangeClientConfigButton];

    [self.view addSubview:stack];

    [NSLayoutConstraint activateConstraints:@[
        [stack.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor constant:margin],
        [stack.topAnchor constraintEqualToAnchor:self.view.topAnchor constant:margin],
        [stack.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor constant:-margin],
        [stack.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor constant:-margin],
    ]];
}

- (void)viewWillAppear
{
    [super viewWillAppear];

    self.hasChanges = NO;

    self.currentPort = settings_store::port;
    auto authUser = settings_store::authUser.get_value();
    auto authPassword = settings_store::authPassword.get_value();
    auto authRequired = settings_store::authRequired ? 1 : 0;

    self.portText.integerValue = self.currentPort;
    self.allowRemoteButton.state = settings_store::allowRemote ? 1 : 0;
    self.authRequiredButton.state = authRequired;

    [self loadMusicDirs];
    [self.musicDirsTable reloadData];

    self.authUserText.enabled = authRequired;
    self.authUserText.stringValue = @(authUser.c_str());
    self.authPasswordText.enabled = authRequired;
    self.authPasswordText.stringValue = @(authPassword.c_str());

    self.allowChangePlaylistsButton.state = settings_store::allowChangePlaylists ? 1 : 0;
    self.allowChangeOutputButton.state = settings_store::allowChangeOutput ? 1 : 0;
    self.allowChangeClientConfigButton.state = settings_store::allowChangeClientConfig ? 1 : 0;
}

- (void)viewWillDisappear
{
    [super viewWillDisappear];

    if (!self.hasChanges)
        return;

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
