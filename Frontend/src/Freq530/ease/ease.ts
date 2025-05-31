import elasticInOut from 'eases/elasticInOut';
import elasticIn from 'eases/elasticIn';
import elasticOut from 'eases/elasticOut';
import sineInOut from 'eases/sineInOut';
import sineIn from 'eases/sineIn';
import sineOut from 'eases/sineOut';
import quadInOut from 'eases/quadInOut';
import quadIn from 'eases/quadIn';
import quadOut from 'eases/quadOut';
import cubicInOut from 'eases/cubicInOut';
import cubicIn from 'eases/cubicIn';
import cubicOut from 'eases/cubicOut';
import quartInOut from 'eases/quartInOut';
import quartIn from 'eases/quartIn';
import quartOut from 'eases/quartOut';
import quintInOut from 'eases/quintInOut';
import quintIn from 'eases/quintIn';
import quintOut from 'eases/quintOut';
import bounceInOut from 'eases/bounceInOut';
import bounceIn from 'eases/bounceIn';
import bounceOut from 'eases/bounceOut';
import linear from 'eases/linear';

export enum EASING_FUNCTION {
  ELASTIC_IN_OUT = 'elastic-in-out',
  ELASTIC_IN = 'elastic-in',
  ELASTIC_OUT = 'elastic-out',
  SINE_IN_OUT = 'sine-in-out',
  SINE_IN = 'sine-in',
  SINE_OUT = 'sine-out',
  QUAD_IN_OUT = 'quad-in-out',
  QUAD_IN = 'quad-in',
  QUAD_OUT = 'quad-out',
  CUBIC_IN_OUT = 'cubic-in-out',
  CUBIC_IN = 'cubic-in',
  CUBIC_OUT = 'cubic-out',
  QUART_IN_OUT = 'quart-in-out',
  QUART_IN = 'quart-in',
  QUART_OUT = 'quart-out',
  QUINT_IN_OUT = 'quint-in-out',
  QUINT_IN = 'quint-in',
  QUINT_OUT = 'quint-out',
  BOUNCE_IN_OUT = 'bounce-in-out',
  BOUNCE_IN = 'bounce-in',
  BOUNCE_OUT = 'bounce-out',
  LINEAR = 'linear',
}

export const EASING_FUNCTION_ACTION = {
  'elastic-in-out': elasticInOut,
  'elastic-in': elasticIn,
  'elastic-out': elasticOut,
  'sine-in-out': sineInOut,
  'sine-in': sineIn,
  'sine-out': sineOut,
  'quad-in-out': quadInOut,
  'quad-in': quadIn,
  'quad-out': quadOut,
  'cubic-in-out': cubicInOut,
  'cubic-in': cubicIn,
  'cubic-out': cubicOut,
  'quart-in-out': quartInOut,
  'quart-in': quartIn,
  'quart-out': quartOut,
  'quint-in-out': quintInOut,
  'quint-in': quintIn,
  'quint-out': quintOut,
  'bounce-in-out': bounceInOut,
  'bounce-in': bounceIn,
  'bounce-out': bounceOut,
  'linear': linear,
} as const;