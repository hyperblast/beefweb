#import <Cocoa/Cocoa.h>

#include "utils.hpp"
#include "plugin_settings.hpp"

using namespace msrv::player_foobar2000;

@interface MainPrefsPageInstance : NSViewController
@end

@interface MainPrefsPageInstance ()
@end

@implementation MainPrefsPageInstance

- (void)setupView
{
    CGFloat margin = 20;

    NSStackView* rootStack = [NSStackView stackViewWithViews:@[
        [NSTextField labelWithString:@"Hello"]
    ]];

    rootStack.alignment = NSLayoutAttributeLeading;
    rootStack.orientation = NSUserInterfaceLayoutOrientationVertical;
    [self.view addSubview:rootStack];

    [NSLayoutConstraint activateConstraints:@[
        [rootStack.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor constant:margin],
        [rootStack.topAnchor constraintEqualToAnchor:self.view.topAnchor constant:margin],
        [rootStack.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor constant:-margin],
        [rootStack.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor constant:-margin],
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
