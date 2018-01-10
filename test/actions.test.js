const assert  = require('chai').assert;
const actions = require('../bin/actions');
const helpers = require('../bin/helpers');
const fs      = require('fs');
var chai      = require('chai');
var setups    = require('./setups');
var expect = chai.expect;

chai.use(require('chai-fs'));
const path = require('path');
var globalModulePath =  path.join(__dirname, '..')

const controllerName1 = 'test';
const controllerName2 = 'test1Controller';
const controllerName3 = 'test2';
const controllerName4 = 'test3';
const controllerName5 = 'test4';

const customRoutesControllerName1 = 'customtest';
const customRoutesControllerName2 = 'customTest1Controller';
const customRoutesControllerName3 = 'customtest2';
const customRoutesControllerName4 = 'customtest3';
const customRoutesControllerName5 = 'customtest4';

const customRoutes1 = '{"route1":"GET","route2":"POST"}';
const customRoutes2 = '{"route1":"POST","route2":"GET","route3":"gEt","route4":"pOsT","route5":"get","route6":"post"}';

const unExistingController = 'test150';
const addRoutes1 = '{"addRoute1":"GET","addRoute2":"POST"}';

const modelName1 = 'Testmodel';
const modelName2 = 'Testmodel1';
const modelName3 = 'Testmodel2';
const modelName4 = 'Testmodel3';

const model1Props = 'prop1: String, prop2: Boolean, prop3: Number';

describe('Actions',function() {
  /**
   * [✔️] Should return true if folder structure does not exits
   * [✔️] Should create folder structure if it does not exist
   * [✔️] Server.js should match serverTemplate
   */
  describe('actions.init tests', function() {
    it('should return true if folder structure does not exist', function() {
      if(!fs.existsSync('./rest')) {
        let result = actions.init();
        assert.equal(result,true);
      }
    })

    it('should create folder structure if it does not exist', function() {
      let result = actions.init();
      expect('./rest').to.be.a.directory();
      assert.pathExists('./rest');

      expect('./rest/controllers').to.be.a.directory();
      assert.pathExists('./rest/controllers');

      expect('./rest/models').to.be.a.directory();
      assert.pathExists('./rest/models');

      expect('./rest/server.js').to.be.a.path();
      assert.pathExists('./rest/server.js');
    })

    it('Server.js should match the serverTemplate.js',function() {
      let serverTemplate = fs.readFileSync(globalModulePath+'/templates/serverTemplate.js').toString();

      let createdServer = fs.readFileSync('./rest/server.js').toString();

      assert.equal(serverTemplate,createdServer);
    })
  })
  /**
   * Test the createPlainController to:
   * [✔️] Creates a controller inside beaConfig.controllersPath
   * [✔️] Creates a controller if the controller name contains the word 'Controller'
   * [✔️] Controller contains the required template
   * [✔️] Does not create a controller if it already exists
   * [✔️] Server.js implements controller settings
   */
  describe('actions.createPlainController tests', function() {
    // Setup
    helpers.createBeaConfig();
    let beaConfig = helpers.loadBeaConfig();

    it('should create plain controller in '+beaConfig.controllersPath,function() {
      let result = actions.createPlainController(controllerName1);
      let pathToController = beaConfig.controllersPath+'/'+controllerName1+'Controller.js';

      expect(pathToController).to.be.a.path();
      assert.pathExists(pathToController);
    })

    it('should create plain controller in '+beaConfig.controllersPath+' if the controller name contains the word `Controller`', function() {
      let result = actions.createPlainController(controllerName2);
      let pathToController = beaConfig.controllersPath+'/'+controllerName2+'.js';

      expect(pathToController).to.be.a.path();
      assert.pathExists(pathToController);
    })

    it('should contain required template',function() {
      let result = actions.createPlainController(controllerName3);
      let pathToController = beaConfig.controllersPath+'/'+controllerName3+'Controller.js';

      let controllerContents = fs.readFileSync(pathToController).toString();
      let templateContents = fs.readFileSync(globalModulePath+'/templates/plainControllerTemplate.js').toString();
      let expectedContents = templateContents.toString().replace(new RegExp('{{controllerName}}','g'), controllerName3);

      assert.equal(controllerContents,expectedContents);
    })

    it('should not create a controller if it already exists',function() {
      let firstCreation = actions.createPlainController(controllerName4);
      let secondCreation = actions.createPlainController(controllerName4);

      assert.equal(secondCreation,false);
    })

    it('Server.js should contain controller that was created',function() {
      let result = actions.createPlainController(controllerName5);

      let serverContents = fs.readFileSync(beaConfig.serverPath).toString();
      let includes1 = serverContents.includes(`var ${controllerName5}Controller = require('${beaConfig.controllersPath}/${controllerName5}Controller');`);
      let includes2 = serverContents.includes(`app.use('/api/${controllerName5}', ${controllerName5}Controller);`);

      assert.equal(includes1,true);
      assert.equal(includes2,true);
    })
  })

  /**
   * [✔️] Should create a controller inside 'beaConfig.modelsPath'
   * [✔️] Creates a controller if the controller name contains the word 'Controller'
   * [✔️] Controller contains the required routes
   * [✔️] Does not create a controller if it already exists
   * [✔️] Server.js implements controller settings
   */
  describe('actions.createControllerWithCustomRoutes tests',function() {
    // Setup
    helpers.createBeaConfig();
    let beaConfig = helpers.loadBeaConfig();

    it('should create a controller in '+beaConfig.controllersPath,function() {
      let result = actions.createControllerWithCustomRoutes(customRoutesControllerName1,JSON.parse(customRoutes1));
      let pathToController = beaConfig.controllersPath+'/'+customRoutesControllerName1+'Controller.js';

      expect(pathToController).to.be.a.path();
      assert.pathExists(pathToController);
    })

    it('should create a custom routes controller in '+beaConfig.controllersPath+' if the controller name contains the word `Controller`', function() {
      let result = actions.createControllerWithCustomRoutes(customRoutesControllerName2,JSON.parse(customRoutes1));
      let pathToController = beaConfig.controllersPath+'/'+customRoutesControllerName2+'.js';

      expect(pathToController).to.be.a.path();
      assert.pathExists(pathToController);
    })

    it('should properly contain the routes provided', function() {
      let parsed = JSON.parse(customRoutes2);
      let result = actions.createControllerWithCustomRoutes(customRoutesControllerName3, parsed);
      let pathToController = beaConfig.controllersPath+'/'+customRoutesControllerName3+'Controller.js';

      let controllerContents = fs.readFileSync(pathToController).toString();
      let containsAll = true;
      let routesString = '';
      // Go through all of the routes and create them
      for(let prop in parsed) {
        let lowercaseProp = prop.toLowerCase();
        let lowercaseMethod = parsed[prop].toLowerCase();

        routesString = `router.${lowercaseMethod}('/${lowercaseProp}',(req,res)`;
        if (!controllerContents.includes(routesString)) {
          containsAll = false; break;
        }

      }

      assert.equal(containsAll,true);
    })

    it('should not create a controller if it already exists',function() {
      let firstCreation = actions.createControllerWithCustomRoutes(customRoutesControllerName4,JSON.parse(customRoutes1));
      let secondCreation = actions.createControllerWithCustomRoutes(customRoutesControllerName4,JSON.parse(customRoutes1));

      assert.equal(secondCreation,false);
    })

    it('Server.js should contain controller that was created',function() {
      let result = actions.createControllerWithCustomRoutes(customRoutesControllerName5, JSON.parse(customRoutes1));

      let serverContents = fs.readFileSync(beaConfig.serverPath).toString();
      let includes1 = serverContents.includes(`var ${customRoutesControllerName5}Controller = require('${beaConfig.controllersPath}/${customRoutesControllerName5}Controller');`);
      let includes2 = serverContents.includes(`app.use('/api/${customRoutesControllerName5}', ${customRoutesControllerName5}Controller);`);

      assert.equal(includes1,true);
      assert.equal(includes2,true);
    })
    
  })

  /**
   * [✔️] Provided controller contains the provided routes
   * [✔️] Does not create routes if the provided controller does not exist
   * [✔️] Should add routes when 'controllernameController' is passed ( contains the word Controller )
   */
  describe('actions.addRoutes tests', function() {

    // Setup
    helpers.createBeaConfig();
    let beaConfig = helpers.loadBeaConfig();

    it('should add the provided routes to the provided controller', function() {
      let parsed = JSON.parse(addRoutes1);
      let result = actions.addRoutes(controllerName1,parsed);
      let controllerContents = fs.readFileSync(beaConfig.controllersPath+'/'+controllerName1+'Controller.js');

      let containsAll = true;
      let routesString = '';
            // Go through all of the routes and create them
      for(let prop in parsed) {
        let lowercaseProp = prop.toLowerCase();
        let lowercaseMethod = parsed[prop].toLowerCase();

        routesString = `router.${lowercaseMethod}('/${lowercaseProp}',(req,res)`;
        if (!controllerContents.includes(routesString)) {
          containsAll = false; break;
        }

      }
      assert.equal(containsAll,true);
    })

    it('should not add routes to unexisting controller', function() {
      let result = actions.addRoutes(unExistingController,JSON.parse(addRoutes1));
      assert.equal(result,false);
    })

    it('should add routes when passed controller name contains the word `Controller`', function() {
      let parsed = JSON.parse(addRoutes1);
      let result = actions.addRoutes(controllerName2,parsed);
      let controllerContents = fs.readFileSync(beaConfig.controllersPath+'/'+controllerName2+'.js');

      let containsAll = true;
      let routesString = '';
            // Go through all of the routes and create them
      for(let prop in parsed) {
        let lowercaseProp = prop.toLowerCase();
        let lowercaseMethod = parsed[prop].toLowerCase();

        routesString = `router.${lowercaseMethod}('/${lowercaseProp}',(req,res)`;
        if (!controllerContents.includes(routesString)) {
          containsAll = false; break;
        }

      }
      assert.equal(containsAll,true);
    })
  })

  /**
   * [✔️] Should create a model in beaConfig.modelsPath and return true
   * [✔️] Should not create a model if the model with the same name already exists
   * [✔️] Should match the modelTemplate.js and should contain all of the properties
   */
  describe('actions.createModel',function() {
    // Setup
    helpers.createBeaConfig();
    let beaConfig = helpers.loadBeaConfig();

    it('should create a model in '+beaConfig.modelsPath+' and return true', function() {
      let result = actions.createModel(modelName1,model1Props);
      let pathToModel = beaConfig.modelsPath+'/'+modelName1+'.js';

      expect(pathToModel).to.be.a.path();
      assert.pathExists(pathToModel);
      assert.equal(result,true);
    })

    it('should not create a model if the model with the same name already exists', function() {
      let firstCreation = actions.createModel(modelName2,model1Props);
      let secondCreation = actions.createModel(modelName2,model1Props);

      assert.equal(secondCreation,false);
    })

    it('should match the modelTemplate.js and should contain all of the properties', function() {
      let result = actions.createModel(modelName3,model1Props);
      let pathToModel = beaConfig.modelsPath+'/'+modelName3+'.js';

      let modelContents = fs.readFileSync(pathToModel).toString();
      let templateContents = fs.readFileSync(globalModulePath+'/templates/modelTemplate.js').toString();
      let expectedContents = templateContents.toString().replace(new RegExp('modelname','g'), modelName3);

      let props = model1Props;

      props = props.replace(new RegExp(',', 'g'), ',\n ');
      props = props.replace(new RegExp('{', 'g'), '{\n   ');
      props = props.replace(new RegExp('}', 'g'), '\n }');
      expectedContents = expectedContents.replace('PROPS',props);


      assert.equal(modelContents,expectedContents);
    })
  })

  /**
   * [✔️] Should create beaConfig.json
   * [✔️] Should not create beaConfig.json if it already exists
   * [] Should contain the stuff, that configTemplate.json contains
   */
  describe('actions.createConfig',function() {

    it('should create beaConfig.json in root directory, if it doesnt exist', function() {
      let result = actions.createConfig();

      expect('./beaConfig.json').to.be.a.path();
      assert.pathExists('./beaConfig.json');
    })

    it('should not create beaConfig.json if it already exists', function() {
      let result1 = actions.createConfig();
      let result2 = actions.createConfig();

      assert.equal(result2,false);
    })

    // it('beaConfig.json should match templates/configTemplate.json', function() {
    //   let result = actions.createConfig();

    //   let configFileContents = fs.readFileSync('./beaConfig.json').toString();
    //   let expectedContents = fs.readFileSync(globalModulePath+'/templates/configTemplate.json').toString();

    //   expect(configFileContents).to.include(expectedContents);
    // })
  })

  /**
   * [✔️] Should create all of the controllers in schema in the beaConfig.controllersPath location
   * [✔️] Controllers should contain correct routes if they are customRoutes controllers
   * [✔️] Should create all of the models in schema
   * [✔️] Models should contain the passed props, and match modelTemplate.js
   */
  describe('actions.buildSchema', function() {

    // Setup
    setups.createTestConfig(setups.configText);
    let beaConfig = helpers.loadBeaConfig();
    before(function() {
      return actions.buildSchema();
    })

    it('should create all of the controllers in schema in the beaConfig.controllersPath location', function() {
      let schema = helpers.getProperty('schema');

      schema.controllers.forEach(function(controller) {
        var path = beaConfig.controllersPath+'/'+controller.name+'Controller.js';
        expect(path).to.be.a.path();
        assert.pathExists(path);
      })
    })

    it('Controllers should contain correct routes if they are customRoutes controllers',function() {
      let schema = helpers.getProperty('schema');

      schema.controllers.forEach(function(controller) {
        let pathToController = beaConfig.controllersPath+'/'+controller.name+'Controller.js';

          let controllerContents = fs.readFileSync(pathToController).toString();
          let containsAll = true;
          let routesString = '';
        if (controller.routes !== "plain") {
          // check if it contains the routes
          for(let prop in controller.routes) {
            let lowercaseProp = prop.toLowerCase();
            let lowercaseMethod = controller.routes[prop].toLowerCase();

            routesString = `router.${lowercaseMethod}('/${lowercaseProp}',(req,res)`;
            if (!controllerContents.includes(routesString)) {
              containsAll = false; break;
            }

          }
        }
        assert.equal(containsAll,true);
      })
    })


    it('should create all of the models in schema', function() {
      let schema = helpers.getProperty('schema');

      schema.models.forEach(function(model) {
        var path = beaConfig.modelsPath+'/'+model.name+'.js';
        expect(path).to.be.a.path();
        assert.pathExists(path);
      })
    })

    it('all models should contain passed props, and match modelTemplate.js', function() {
      let schema = helpers.getProperty('schema');

      schema.models.forEach(function(model) {
        let pathToModel = beaConfig.modelsPath+'/'+model.name+'.js';

        let modelContents = fs.readFileSync(pathToModel).toString();
        let templateContents = fs.readFileSync(globalModulePath+'/templates/modelTemplate.js').toString();
        let expectedContents = templateContents.toString().replace(new RegExp('modelname','g'), model.name);

        let props = model.props;

        props = props.replace(new RegExp(',', 'g'), ',\n ');
        props = props.replace(new RegExp('{', 'g'), '{\n   ');
        props = props.replace(new RegExp('}', 'g'), '\n }');
        expectedContents = expectedContents.replace('PROPS',props);


        assert.equal(modelContents,expectedContents);
      })
    })

  })

  

})