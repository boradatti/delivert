import type { FC, ComponentPropsWithRef } from 'react';

import { ReactComponent as LogoutIcon } from '../../assets/icons/logout.svg';

export const Logout: FC<ComponentPropsWithRef<'svg'>> = (props) => {
  return <LogoutIcon {...props} />;
};

export default Logout;
