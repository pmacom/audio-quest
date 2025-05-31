Below is an example typescript file that we are going to export after we
study the user provided glsl shader code. The user provided glsl shader code is what the user wants to somehow contort and accurately convert a potentially minified or abstracted shaderToy or shaderFrog glsl shader code. We have to understand what that code is trying to do and therefore perform our best to honor it's initial mathematical intent. While doing so, we will make wild assumptions about the visual impact this specific variable may have on the impact of the final rendered image. Sometimes, when we think of a variable for the first time, we are not sure of it's overal ineteraction with other variables. Whenever we reflect on a GLSL shader variable that is declared within the code, we will reflect on every other critical or violent variable within the glsl shader code. For clarification, a critical variable is defined as a variable that is declared to optimize or clarify the code for performance or usser/developer purposes. Critical variables should be listed if (and only if) the variable has a considerable impact on how another pixel is rendered. Some variables will not be that impactful. These CRITICAL OR VIOLENT (Will be described soon) will be weighed on impact on the final rendered image and then assigned a value of 1 to 9. THERE WILL ONLY BE 10 TWEAK VARIABLES. TWEAK_{NUMBER} is the format of the uniform name declarations. Therefore, any variable that is critical will be drasitcally important/impactful to the final rendered pixel. Some variables will have dangerous value ranges that can be mathematically predicted as they rapidly encroach infinity, null or some other state that would negatively impact either performance or execution. Those variables that have such a dangerous value range will be deemed to be VIOLENT. violent TWEAK variables will be commented in the most visible way possible so a developer can not avoid seeing it. We will assume all TWEAK_{NUMBER} variables can default at 1, so as to not cause critical or violent code problems that will throw our variables into directions that would cause a noticable spike in performance or further calculations.

```ts
import { ShaderSettings, TweakRanges } from "../types";

export const Default_VertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const Default_FragmentShader = `
uniform vec2 uResolution;
uniform float uAdjustedAccumulatedTime;
uniform float TWEAK_1;
uniform float TWEAK_2;
uniform float TWEAK_3;
uniform float TWEAK_4;
uniform float TWEAK_5;
uniform float TWEAK_6;
uniform float TWEAK_7;
uniform float TWEAK_8;
uniform float TWEAK_9;
uniform float TWEAK_10;
varying vec2 vUv;

void main() {
    // <YOU INSERT THIS CODE FROM THE PROVIDED GLSL SHADER CODE HERE>
    // PLEASE NOTE:
    // PAY ATTENTION TO CRITICAL VALUES IN THE SHADER THAT ARE CALCULATED
    // ASSUME WILDLY ABOUT WHAT THE VALUES WOULD BE USED FOR IN THE SHADER
    // PLEASE THESE VARIABLES THEM NAMES IN YOUR HEAD AS TO WHAT THEY ARE FOR
    // PLEASE COMMENT THE DECLARATIONS OF TWEAK_{NUMBER} WITH WHAT THEY ARE FOR
    // PLEASE attach all of the MOST critical variables declared in the
    // shader code to a TWEAK_{NUMBER} variable that goes from 1 to 10
    // and then use that TWEAK_{NUMBER} variable by multiplying the CRITICAL
    // variables that we named and recognized in our head from earlier.
    // PLEASE NOTE:
    // AT THIS POINT IN TIME, PLEASE THINK OF THE EXPECTED MIN AND MAX OF
    // EACH CRITICAL OR VIOLENT VARIABLE WE HAVE DECLARED.
    // PLEASE NOTE:
    // ALSO ADD A COMMENT AS TO IF A VARIABLE IS CRITICAL OR VIOLENT.
    gl_FragColor = outputColor;
}
`;

/**
 * Tweak ranges for the shader.
 * 
 * PLEASE READ THIS AND USE AS A GUIDE FOR CREATING NEW SHADERS.
 * We should make the best assumption we can about how these values
 * would be in terms of range. More often than not, it is safe to set
 * as simply 1 for the default value and 0 for the min and max. We need
 * to pay attention to potentially violent variables that if they achieve
 * a specific value, they will break the shader or crash the browser.
 * Sometimes when values are below or equal to 0, they will break the shader.
 * Sometimes when values are above 1, they will break the shader.
 * Sometimes when values are used to declare how many times something
 * should loop, it is to be considered violent and should take into heavy
 * consideration the min and max with more scrutiny.
 */
const Default_Tweak_Ranges: TweakRanges = [
    { min: 1, max: 1.2, value: 1.1, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 30, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },  
    { min: 0, max: 10, value: 0.5, source: null },
    
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
]

export const TEST_SHADER: ShaderSettings = {
    id: "suitable-name-of-shader",
    isActive: false,
    name: "Suitable Name of Shader",
    vertexShader: Default_VertexShader,
    fragmentShader: Default_FragmentShader,
    ranges: Default_Tweak_Ranges
}
```