"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var babel;
var istanbulPlugin;
var jestPreset;
function importBabelDeps() {
    if (babel) {
        return;
    }
    babel = require('babel-core');
    istanbulPlugin = require('babel-plugin-istanbul').default;
    jestPreset = require('babel-preset-jest');
}
var logger_1 = require("./logger");
function postProcessCode(compilerOptions, jestConfig, tsJestConfig, transformOptions, transpiledText, filePath) {
    var postHook = exports.getPostProcessHook(compilerOptions, jestConfig, tsJestConfig);
    return postHook(transpiledText, filePath, jestConfig, transformOptions);
}
exports.postProcessCode = postProcessCode;
function createBabelTransformer(options) {
    importBabelDeps();
    options = __assign({}, options, { plugins: options.plugins || [], presets: (options.presets || []).concat([jestPreset]), retainLines: true, sourceMaps: 'inline' });
    delete options.cacheDirectory;
    delete options.filename;
    return function (src, filename, config, transformOptions) {
        var theseOptions = Object.assign({ filename: filename }, options);
        if (transformOptions && transformOptions.instrument) {
            theseOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
            theseOptions.plugins = theseOptions.plugins.concat([
                [
                    istanbulPlugin,
                    {
                        cwd: config.rootDir,
                        exclude: [],
                    },
                ],
            ]);
        }
        return babel.transform(src, theseOptions).code;
    };
}
exports.getPostProcessHook = function (tsCompilerOptions, jestConfig, tsJestConfig) {
    if (tsJestConfig.skipBabel) {
        logger_1.logOnce('Not using any postprocess hook.');
        return function (src) { return src; };
    }
    var plugins = Array.from((tsJestConfig.babelConfig && tsJestConfig.babelConfig.plugins) || []);
    if (tsCompilerOptions.allowSyntheticDefaultImports) {
        plugins.push('transform-es2015-modules-commonjs');
    }
    var babelOptions = __assign({}, tsJestConfig.babelConfig, { babelrc: tsJestConfig.useBabelrc || false, plugins: plugins, presets: tsJestConfig.babelConfig ? tsJestConfig.babelConfig.presets : [] });
    logger_1.logOnce('Using babel with options:', babelOptions);
    return createBabelTransformer(babelOptions);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdHByb2Nlc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcG9zdHByb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQU9BLElBQUksS0FBNEIsQ0FBQztBQUNqQyxJQUFJLGNBQThDLENBQUM7QUFDbkQsSUFBSSxVQUFzQyxDQUFDO0FBQzNDO0lBQ0ksSUFBSSxLQUFLLEVBQUU7UUFDVCxPQUFPO0tBQ1I7SUFDRCxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzlCLGNBQWMsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDMUQsVUFBVSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFVRCxtQ0FBbUM7QUFHbkMseUJBQ0UsZUFBZ0MsRUFDaEMsVUFBc0IsRUFDdEIsWUFBMEIsRUFDMUIsZ0JBQWtDLEVBQ2xDLGNBQXNCLEVBQ3RCLFFBQWdCO0lBRWhCLElBQU0sUUFBUSxHQUFHLDBCQUFrQixDQUNqQyxlQUFlLEVBQ2YsVUFBVSxFQUNWLFlBQVksQ0FDYixDQUFDO0lBRUYsT0FBTyxRQUFRLENBQUMsY0FBYyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUMxRSxDQUFDO0FBZkQsMENBZUM7QUFFRCxnQ0FDRSxPQUE4QjtJQUU5QixlQUFlLEVBQUUsQ0FBQztJQUNsQixPQUFPLGdCQUNGLE9BQU8sSUFDVixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLEVBQzlCLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsRUFHckQsV0FBVyxFQUFFLElBQUksRUFHakIsVUFBVSxFQUFFLFFBQVEsR0FDckIsQ0FBQztJQUNGLE9BQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQztJQUM5QixPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFFeEIsT0FBTyxVQUNMLEdBQVcsRUFDWCxRQUFnQixFQUNoQixNQUFrQixFQUNsQixnQkFBa0M7UUFFbEMsSUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsVUFBQSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDMUQsSUFBSSxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUU7WUFDbkQsWUFBWSxDQUFDLHNCQUFzQixHQUFHLHdCQUF3QixDQUFDO1lBRS9ELFlBQVksQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQ2pEO29CQUNFLGNBQWM7b0JBQ2Q7d0JBRUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPO3dCQUNuQixPQUFPLEVBQUUsRUFBRTtxQkFDWjtpQkFDRjthQUNGLENBQUMsQ0FBQztTQUNKO1FBRUQsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDakQsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVZLFFBQUEsa0JBQWtCLEdBQUcsVUFDaEMsaUJBQWtDLEVBQ2xDLFVBQXNCLEVBQ3RCLFlBQTBCO0lBRTFCLElBQUksWUFBWSxDQUFDLFNBQVMsRUFBRTtRQUMxQixnQkFBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDM0MsT0FBTyxVQUFBLEdBQUcsSUFBSSxPQUFBLEdBQUcsRUFBSCxDQUFHLENBQUM7S0FDbkI7SUFFRCxJQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUN4QixDQUFDLFlBQVksQ0FBQyxXQUFXLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQ3JFLENBQUM7SUFFRixJQUFJLGlCQUFpQixDQUFDLDRCQUE0QixFQUFFO1FBQ2xELE9BQU8sQ0FBQyxJQUFJLENBQUMsbUNBQW1DLENBQUMsQ0FBQztLQUNuRDtJQUVELElBQU0sWUFBWSxnQkFDYixZQUFZLENBQUMsV0FBVyxJQUMzQixPQUFPLEVBQUUsWUFBWSxDQUFDLFVBQVUsSUFBSSxLQUFLLEVBQ3pDLE9BQU8sU0FBQSxFQUNQLE9BQU8sRUFBRSxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUMxRSxDQUFDO0lBRUYsZ0JBQU8sQ0FBQywyQkFBMkIsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUVuRCxPQUFPLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzlDLENBQUMsQ0FBQyJ9