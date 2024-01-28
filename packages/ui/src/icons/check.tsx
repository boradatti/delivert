import type { FC, ComponentPropsWithRef } from 'react';

import { ReactComponent as CheckIcon } from '../../assets/icons/check.svg';

export const Check: FC<ComponentPropsWithRef<'svg'>> = (props) => {
  return <CheckIcon {...props} />;
};

export default Check;
