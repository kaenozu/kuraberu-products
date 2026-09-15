// Tests must not inherit Production deployment settings from the build process.
// Runtime production checks are covered explicitly by tests that stub env values.
process.env.DEPLOYMENT_ENV = "preview";
process.env.PUBLIC_AMAZON_ASSOCIATE_TAG = "";
