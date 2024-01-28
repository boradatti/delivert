import type { FC, ComponentPropsWithRef } from 'react';

import { ReactComponent as CloseIcon } from '../../assets/icons/close.svg';

export const Close: FC<ComponentPropsWithRef<'svg'>> = (props) => {
  return <CloseIcon {...props} />;
};

export default Close;
