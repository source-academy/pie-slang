module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest',
    {
      tsconfig: {
        target: "ES2020",
        lib: ["ES2020"],
        esModuleInterop: true
      }
    }
  ]
  },
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
};