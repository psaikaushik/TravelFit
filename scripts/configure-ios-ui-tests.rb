# Generate a disposable Xcode UI target and shared scheme in the CI checkout.
require 'xcodeproj'

project_path = File.expand_path('../ios/TravelFit.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |target| target.name == 'TravelFit' }
abort 'TravelFit application target is missing' unless app

test_target_name = 'TravelFitUITests'
test_source = 'TravelFitUITests/TravelFitUITests.swift'
abort "Missing #{test_source}" unless File.file?(File.join(File.dirname(project_path), test_source))

deployment_target = app.build_settings('Release').fetch('IPHONEOS_DEPLOYMENT_TARGET')
test_target = project.targets.find { |target| target.name == test_target_name }
test_target ||= project.new_target(:ui_test_bundle, test_target_name, :ios, deployment_target, nil, :swift)
source = project.main_group.files.find { |file| file.path == test_source }
source ||= project.main_group.new_file(test_source)
sources = test_target.source_build_phase
sources.add_file_reference(source) unless sources.files_references.include?(source)
test_target.add_dependency(app)

test_target.build_configurations.each do |configuration|
  configuration.build_settings.merge!(
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.travelfit.app.uitests',
    'SWIFT_VERSION' => '5.0',
    'TARGETED_DEVICE_FAMILY' => '1',
    'TEST_TARGET_NAME' => app.name
  )
  team = app.build_settings(configuration.name)['DEVELOPMENT_TEAM']
  configuration.build_settings['DEVELOPMENT_TEAM'] = team if team
end

target_attributes = project.root_object.attributes['TargetAttributes'] ||= {}
target_attributes[test_target.uuid] = { 'TestTargetID' => app.uuid }
project.save

%w[TravelFitSimulatorE2E TravelFitDeviceE2E].each do |name|
  scheme = Xcodeproj::XCScheme.new
  scheme.configure_with_targets(app, test_target, launch_target: true)
  scheme.test_action.build_configuration = 'Release'
  scheme.test_action.add_macro_expansion(Xcodeproj::XCScheme::MacroExpansion.new(app))
  scheme.save_as(project_path, name, true)
  puts "Configured #{name} with #{test_target_name}"
end
