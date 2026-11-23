#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

@interface TravelFitTests : XCTestCase

@end

@implementation TravelFitTests

- (UIView *)view:(UIView *)view withLabel:(NSString *)label
{
  if ([view.accessibilityLabel isEqualToString:label]) {
    return view;
  }
  for (UIView *subview in [view subviews]) {
    UIView *match = [self view:subview withLabel:label];
    if (match) {
      return match;
    }
  }
  return nil;
}

- (UIView *)waitForLabel:(NSString *)label alongsideLabel:(NSString *)otherLabel
{
  NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:25];
  while ([deadline timeIntervalSinceNow] > 0) {
    UIView *root = UIApplication.sharedApplication.delegate.window.rootViewController.view;
    UIView *control = [self view:root withLabel:label];
    if (root.window && control && [self view:root withLabel:otherLabel]) {
      return control;
    }
    [[NSRunLoop mainRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  return nil;
}

- (void)attachWindowWithName:(NSString *)name
{
  UIWindow *window = UIApplication.sharedApplication.delegate.window;
  if (window && !CGRectIsEmpty(window.bounds)) {
    UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithBounds:window.bounds];
    UIImage *screenshot = [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
      [window drawViewHierarchyInRect:window.bounds afterScreenUpdates:YES];
    }];
    XCTAttachment *attachment = [XCTAttachment attachmentWithImage:screenshot];
    attachment.name = name;
    attachment.lifetime = XCTAttachmentLifetimeKeepAlways;
    [self addAttachment:attachment];
  }
}

- (void)testLaunchesFitnessOnboarding
{
  UIView *skip = [self waitForLabel:@"Skip" alongsideLabel:@"Next"];
  [self attachWindowWithName:@"TravelFit onboarding"];
  XCTAssertNotNil(skip, @"The fitness onboarding screen did not show its Skip and Next controls.");
  if (!skip) {
    return;
  }

  BOOL activated = [skip accessibilityActivate];
  XCTAssertTrue(activated, @"The onboarding Skip control did not respond to accessibility activation.");
  if (!activated) {
    return;
  }

  UIView *createAccount = [self waitForLabel:@"Start now, create an account"
                             alongsideLabel:@"Already have an account, log in"];
  [self attachWindowWithName:@"TravelFit welcome"];
  XCTAssertNotNil(createAccount, @"Skipping onboarding did not open the fitness welcome screen.");
}

@end
