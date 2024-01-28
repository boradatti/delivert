import type { FC, ComponentPropsWithRef } from 'react';

import { ReactComponent as MoreIcon } from '../../assets/icons/more.svg';

export const More: FC<ComponentPropsWithRef<'svg'>> = (props) => {
  return <MoreIcon {...props} />;
};

export default More;
