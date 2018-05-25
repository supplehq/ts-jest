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
var crypto = require("crypto");
var fs = require("fs");
var fsExtra = require("fs-extra");
var path = require("path");
var tsc = require("typescript");
var logger_1 = require("./logger");
var _ = require("lodash");
function getTSJestConfig(globals) {
    return globals && globals['ts-jest'] ? globals['ts-jest'] : {};
}
exports.getTSJestConfig = getTSJestConfig;
function formatTscParserErrors(errors) {
    return errors.map(function (s) { return JSON.stringify(s, null, 4); }).join('\n');
}
function readCompilerOptions(configPath, rootDir) {
    configPath = path.resolve(rootDir, configPath);
    var loaded = tsc.readConfigFile(configPath, function (file) {
        var read = tsc.sys.readFile(file);
        if (!read) {
            throw new Error("ENOENT: no such file or directory, open '" + configPath + "'");
        }
        return read;
    });
    if (loaded.error) {
        throw new Error(JSON.stringify(loaded.error, null, 4));
    }
    var basePath = path.resolve(rootDir);
    var parsedConfig = tsc.parseJsonConfigFileContent(loaded.config, tsc.sys, basePath);
    if (parsedConfig.errors.length > 0) {
        var formattedErrors = formatTscParserErrors(parsedConfig.errors);
        throw new Error("Some errors occurred while attempting to read from " + configPath + ": " + formattedErrors);
    }
    return parsedConfig.options;
}
function getStartDir() {
    var grandparent = path.resolve(__dirname, '..', '..');
    if (grandparent.endsWith(path.sep + "node_modules")) {
        return process.cwd();
    }
    return '.';
}
function getPathToClosestTSConfig(startDir, previousDir) {
    if (!startDir) {
        return getPathToClosestTSConfig(getStartDir());
    }
    var tsConfigPath = path.join(startDir, 'tsconfig.json');
    var startDirPath = path.resolve(startDir);
    var previousDirPath = path.resolve(previousDir || '/');
    if (startDirPath === previousDirPath || fs.existsSync(tsConfigPath)) {
        return tsConfigPath;
    }
    return getPathToClosestTSConfig(path.join(startDir, '..'), startDir);
}
function getTSConfigPathFromConfig(globals, rootDir) {
    var defaultTSConfigFile = getPathToClosestTSConfig(rootDir);
    if (!globals) {
        return defaultTSConfigFile;
    }
    var tsJestConfig = getTSJestConfig(globals);
    if (tsJestConfig.tsConfigFile) {
        return tsJestConfig.tsConfigFile;
    }
    return defaultTSConfigFile;
}
function mockGlobalTSConfigSchema(globals) {
    var configPath = getTSConfigPathFromConfig(globals);
    return { 'ts-jest': { tsConfigFile: configPath } };
}
exports.mockGlobalTSConfigSchema = mockGlobalTSConfigSchema;
exports.getTSConfig = _.memoize(getTSConfig_local, function (globals, rootDir) {
    return JSON.stringify(globals, rootDir);
});
function getTSConfig_local(globals, rootDir) {
    if (rootDir === void 0) { rootDir = ''; }
    var configPath = getTSConfigPathFromConfig(globals, rootDir);
    logger_1.logOnce("Reading tsconfig file from path " + configPath);
    var skipBabel = getTSJestConfig(globals).skipBabel;
    var config = readCompilerOptions(configPath, rootDir);
    logger_1.logOnce('Original typescript config before modifications: ', __assign({}, config));
    delete config.sourceMap;
    config.inlineSourceMap = true;
    config.inlineSources = true;
    delete config.outDir;
    if (configPath === path.join(getStartDir(), 'tsconfig.json')) {
        config.module = tsc.ModuleKind.CommonJS;
    }
    config.module = config.module || tsc.ModuleKind.CommonJS;
    config.jsx = config.jsx || tsc.JsxEmit.React;
    if (config.allowSyntheticDefaultImports && !skipBabel) {
        config.module = tsc.ModuleKind.ES2015;
    }
    return config;
}
function cacheFile(jestConfig, filePath, src) {
    if (!jestConfig.testRegex || !filePath.match(jestConfig.testRegex)) {
        var outputFilePath = path.join(jestConfig.cacheDirectory, '/ts-jest/', crypto
            .createHash('md5')
            .update(filePath)
            .digest('hex'));
        fsExtra.outputFileSync(outputFilePath, src);
    }
}
exports.cacheFile = cacheFile;
function injectSourcemapHook(filePath, typeScriptCode, src) {
    var start = src.length > 12 ? src.substr(1, 10) : '';
    var filePathParam = JSON.stringify(filePath);
    var codeParam = JSON.stringify(typeScriptCode);
    var sourceMapHook = "require('ts-jest').install(" + filePathParam + ", " + codeParam + ")";
    return start === 'use strict'
        ? "'use strict';" + sourceMapHook + ";" + src
        : sourceMapHook + ";" + src;
}
exports.injectSourcemapHook = injectSourcemapHook;
function runTsDiagnostics(filePath, compilerOptions) {
    var program = tsc.createProgram([filePath], compilerOptions);
    var allDiagnostics = tsc.getPreEmitDiagnostics(program);
    var formattedDiagnostics = allDiagnostics.map(function (diagnostic) {
        if (diagnostic.file) {
            var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
            var message = tsc.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            return path.relative(process.cwd(), diagnostic.file.fileName) + " (" + (line + 1) + "," + (character + 1) + "): " + message + "\n";
        }
        return "" + tsc.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    });
    if (formattedDiagnostics.length) {
        throw new Error(formattedDiagnostics.join(''));
    }
}
exports.runTsDiagnostics = runTsDiagnostics;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLCtCQUFpQztBQUNqQyx1QkFBeUI7QUFDekIsa0NBQW9DO0FBQ3BDLDJCQUE2QjtBQUM3QixnQ0FBa0M7QUFFbEMsbUNBQW1DO0FBQ25DLDBCQUE0QjtBQUU1Qix5QkFBZ0MsT0FBc0I7SUFDcEQsT0FBTyxPQUFPLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNqRSxDQUFDO0FBRkQsMENBRUM7QUFFRCwrQkFBK0IsTUFBd0I7SUFDckQsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUExQixDQUEwQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFFRCw2QkFBNkIsVUFBa0IsRUFBRSxPQUFlO0lBQzlELFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUcvQyxJQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxVQUFBLElBQUk7UUFDaEQsSUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFJcEMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULE1BQU0sSUFBSSxLQUFLLENBQ2IsOENBQTRDLFVBQVUsTUFBRyxDQUMxRCxDQUFDO1NBQ0g7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3hEO0lBR0QsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2QyxJQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsMEJBQTBCLENBQ2pELE1BQU0sQ0FBQyxNQUFNLEVBQ2IsR0FBRyxDQUFDLEdBQUcsRUFDUCxRQUFRLENBQ1QsQ0FBQztJQUlGLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ2xDLElBQU0sZUFBZSxHQUFHLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRSxNQUFNLElBQUksS0FBSyxDQUNiLHdEQUFzRCxVQUFVLFVBQUssZUFBaUIsQ0FDdkYsQ0FBQztLQUNIO0lBQ0QsT0FBTyxZQUFZLENBQUMsT0FBTyxDQUFDO0FBQzlCLENBQUM7QUFFRDtJQVFFLElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN4RCxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUksSUFBSSxDQUFDLEdBQUcsaUJBQWMsQ0FBQyxFQUFFO1FBQ25ELE9BQU8sT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0tBQ3RCO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsa0NBQ0UsUUFBaUIsRUFDakIsV0FBb0I7SUFNcEIsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNiLE9BQU8sd0JBQXdCLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztLQUNoRDtJQUVELElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRTFELElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDNUMsSUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLENBQUM7SUFFekQsSUFBSSxZQUFZLEtBQUssZUFBZSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUU7UUFDbkUsT0FBTyxZQUFZLENBQUM7S0FDckI7SUFFRCxPQUFPLHdCQUF3QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7QUFFRCxtQ0FDRSxPQUFzQixFQUN0QixPQUFnQjtJQUVoQixJQUFNLG1CQUFtQixHQUFHLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlELElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDWixPQUFPLG1CQUFtQixDQUFDO0tBQzVCO0lBRUQsSUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTlDLElBQUksWUFBWSxDQUFDLFlBQVksRUFBRTtRQUM3QixPQUFPLFlBQVksQ0FBQyxZQUFZLENBQUM7S0FDbEM7SUFFRCxPQUFPLG1CQUFtQixDQUFDO0FBQzdCLENBQUM7QUFFRCxrQ0FDRSxPQUFzQjtJQUV0QixJQUFNLFVBQVUsR0FBRyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0RCxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7QUFDckQsQ0FBQztBQUxELDREQUtDO0FBRVksUUFBQSxXQUFXLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxVQUFDLE9BQU8sRUFBRSxPQUFPO0lBSXZFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUM7QUFHSCwyQkFBMkIsT0FBTyxFQUFFLE9BQW9CO0lBQXBCLHdCQUFBLEVBQUEsWUFBb0I7SUFDdEQsSUFBTSxVQUFVLEdBQUcseUJBQXlCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQy9ELGdCQUFPLENBQUMscUNBQW1DLFVBQVksQ0FBQyxDQUFDO0lBQ3pELElBQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFFckQsSUFBTSxNQUFNLEdBQUcsbUJBQW1CLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3hELGdCQUFPLENBQUMsbURBQW1ELGVBQU8sTUFBTSxFQUFHLENBQUM7SUFLNUUsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDO0lBQ3hCLE1BQU0sQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO0lBQzlCLE1BQU0sQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBTTVCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUVyQixJQUFJLFVBQVUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLGVBQWUsQ0FBQyxFQUFFO1FBSzVELE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7S0FDekM7SUFFRCxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7SUFDekQsTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBRTdDLElBQUksTUFBTSxDQUFDLDRCQUE0QixJQUFJLENBQUMsU0FBUyxFQUFFO1FBRXJELE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7S0FDdkM7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsbUJBQ0UsVUFBc0IsRUFDdEIsUUFBZ0IsRUFDaEIsR0FBVztJQUdYLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDbEUsSUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FDOUIsVUFBVSxDQUFDLGNBQWMsRUFDekIsV0FBVyxFQUNYLE1BQU07YUFDSCxVQUFVLENBQUMsS0FBSyxDQUFDO2FBQ2pCLE1BQU0sQ0FBQyxRQUFRLENBQUM7YUFDaEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUNqQixDQUFDO1FBRUYsT0FBTyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDN0M7QUFDSCxDQUFDO0FBbEJELDhCQWtCQztBQUVELDZCQUNFLFFBQWdCLEVBQ2hCLGNBQXNCLEVBQ3RCLEdBQVc7SUFFWCxJQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUV2RCxJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9DLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDakQsSUFBTSxhQUFhLEdBQUcsZ0NBQThCLGFBQWEsVUFBSyxTQUFTLE1BQUcsQ0FBQztJQUVuRixPQUFPLEtBQUssS0FBSyxZQUFZO1FBQzNCLENBQUMsQ0FBQyxrQkFBZ0IsYUFBYSxTQUFJLEdBQUs7UUFDeEMsQ0FBQyxDQUFJLGFBQWEsU0FBSSxHQUFLLENBQUM7QUFDaEMsQ0FBQztBQWRELGtEQWNDO0FBRUQsMEJBQ0UsUUFBZ0IsRUFDaEIsZUFBb0M7SUFFcEMsSUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQy9ELElBQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMxRCxJQUFNLG9CQUFvQixHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsVUFBQSxVQUFVO1FBQ3hELElBQUksVUFBVSxDQUFDLElBQUksRUFBRTtZQUNiLElBQUEsb0VBRUwsRUFGTyxjQUFJLEVBQUUsd0JBQVMsQ0FFckI7WUFDRixJQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsNEJBQTRCLENBQzlDLFVBQVUsQ0FBQyxXQUFXLEVBQ3RCLElBQUksQ0FDTCxDQUFDO1lBQ0YsT0FBVSxJQUFJLENBQUMsUUFBUSxDQUNyQixPQUFPLENBQUMsR0FBRyxFQUFFLEVBQ2IsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQ3pCLFdBQUssSUFBSSxHQUFHLENBQUMsV0FBSSxTQUFTLEdBQUcsQ0FBQyxZQUFNLE9BQU8sT0FBSSxDQUFDO1NBQ2xEO1FBRUQsT0FBTyxLQUFHLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBRyxDQUFDO0lBQzdFLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxvQkFBb0IsQ0FBQyxNQUFNLEVBQUU7UUFDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNoRDtBQUNILENBQUM7QUEzQkQsNENBMkJDIn0=