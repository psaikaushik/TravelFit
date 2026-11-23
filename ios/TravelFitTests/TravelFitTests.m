#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

@interface TravelFitTests : XCTestCase

@end

@implementation TravelFitTests

- (BOOL)view:(UIView *)view containsLabel:(NSString *)label
{
  if ([view.accessibilityLabel isEqualToString:label]) {
    return YES;
  }
  for (UIView *subview in [view subviews]) {
    if ([self view:subview containsLabel:label]) {
      return YES;
    }
  }
  return NO;
}

- (void)testLaunchesFitnessOnboarding
{
  NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:25];
  while ([deadline timeIntervalSinceNow] > 0) {
    UIWindow *window = UIApplication.sharedApplication.delegate.window;
    UIView *root = window.rootViewController.view;
    if (root.window &&
        [self view:root containsLabel:@"Skip"] &&
        [self view:root containsLabel:@"Next"]) {
      return;
    }
    [[NSRunLoop mainRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }

  XCTFail(@"The fitness onboarding screen did not show its Skip and Next controls.");
}

@end
