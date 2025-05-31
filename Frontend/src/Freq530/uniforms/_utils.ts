// import { ShaderDefaultSettings } from "./uniforms";

// const generateShaderUniformCode = () => {
//   return Object.entries(ShaderDefaultSettings).map(([key, value]) => {
//     let type = 'float';
//     if (value.shaderDataType === 1) type = 'bool'; // ShaderDataTypes.BOOLEAN === 1
//     // Add more types as needed in the future
//     return `uniform ${type} ${value.shaderUniformName};`;
//   }).join('\n')
// }

// export const UNIFORM_UTILS = {
//   generateShaderUniformCode
// }