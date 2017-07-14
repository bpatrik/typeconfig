module.exports = function (config) {
    config.set({
        frameworks: ["jasmine", "karma-typescript"],
        files: [
            {pattern: "src/**/*!(d).ts"},
            {pattern: "test/**/*.spec.ts"}
        ],
        exclude: ["src/**/*.d.ts"],
        preprocessors: {
            "**/*!(d).ts": ["karma-typescript"]
        },
        karmaTypescriptConfig: {
            tsconfig: './tsconfig.json'
        },
        reporters: ["progress", "karma-typescript"],
        browsers: ["PhantomJS"],
        port: 9876,
        colors: true,
        autoWatch: false,
        singleRun: true
    });
};