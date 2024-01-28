import type { FC, ComponentPropsWithRef } from 'react';

import { ReactComponent as TimeIcon } from '../../assets/icons/time.svg';

export const Time: FC<ComponentPropsWithRef<'svg'>> = (props) => {
  return <TimeIcon {...props} />;
};

export default Time;
