#import <Cocoa/Cocoa.h>

#include "utils.hpp"
#include "plugin_settings.hpp"

using namespace msrv::player_foobar2000;

@interface MainPrefsPageInstance : NSViewController
@end

@interface MainPrefsPageInstance ()
    @property(strong, nonatomic) NSTextField* portText;
    @property(strong, nonatomic) NSButton* allowRemoteButton;
    @property(strong, nonatomic) NSTextField* musicDirsText;
    @property(strong, nonatomic) NSButton* authRequiredButton;
    @property(strong, nonatomic) NSTextField* authUserText;
    @property(strong, nonatomic) NSSecureTextField* authPasswordText;
@end

@implementation MainPrefsPageInstance

- (NSBox*)boxWithTitle:(NSString*)title views:(NSArray<NSView*>*)views
{
    NSBox* box = [[NSBox alloc] init];
    box.boxType = NSBoxPrimary;
    box.title = title;

    NSStackView* stack = [NSStackView stackViewWithViews:views];
    stack.alignment = NSLayoutAttributeLeading;
    stack.orientation = NSUserInterfaceLayoutOrientationVertical;
    [box setContentView:stack];
    return box;
}

- (IBAction)allowRemoteChanged:(id)sender
{
}

- (IBAction)requireAuthChanged:(id)sender
{
    BOOL enabled = [self.authRequiredButton state] == NSControlStateValueOn;
    self.authUserText.editable = enabled;
    self.authPasswordText.editable = enabled;
}

- (void)setupView
{
    self.portText = [NSTextField textFieldWithString:@""];

    [NSLayoutConstraint activateConstraints:@[
        [self.portText.widthAnchor constraintEqualToConstant:50],
        [self.portText.heightAnchor constraintEqualToConstant:25],
    ]];

    self.allowRemoteButton = [
        NSButton checkboxWithTitle:@"Allow remote connections"
                 target:self
                 action:@selector(allowRemoteChanged:)
    ];

    self.musicDirsText = [NSTextField textFieldWithString:@""];
    self.musicDirsText.usesSingleLineMode = NO;

    [NSLayoutConstraint activateConstraints:@[
        [self.musicDirsText.heightAnchor constraintEqualToConstant:200]
    ]];

    self.authRequiredButton = [
        NSButton checkboxWithTitle:@"Require authentication"
                 target:self
                 action:@selector(requireAuthChanged:)
    ];

    self.authUserText = [NSTextField textFieldWithString:@""];
    self.authPasswordText = [[NSSecureTextField alloc] init];

    NSStackView* stack = [NSStackView stackViewWithViews:@[
        [NSTextField labelWithString: @"Port:"],
        self.portText,
        self.allowRemoteButton,
        [NSTextField labelWithString: @"Browseable music directories:"],
        self.musicDirsText,
        self.authRequiredButton,
        [NSTextField labelWithString: @"User:"],
        self.authUserText,
        [NSTextField labelWithString: @"Password:"],
        self.authPasswordText,
    ]];

    stack.alignment = NSLayoutAttributeLeading;
    stack.orientation = NSUserInterfaceLayoutOrientationVertical;
    [self.view addSubview:stack];

    CGFloat margin = 20;

    [NSLayoutConstraint activateConstraints:@[
        [stack.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor constant:margin],
        [stack.topAnchor constraintEqualToAnchor:self.view.topAnchor constant:margin],
        [stack.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor constant:-margin],
        [stack.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor constant:-margin],
    ]];
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    [self setupView];
}

- (void)viewWillAppear
{
    [super viewWillAppear];
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
