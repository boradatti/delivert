import type { FC, ComponentPropsWithRef } from 'react';

import { ReactComponent as LogoIcon } from '../../assets/icons/logo.svg';
// import LogoIcon from '../../assets/icons/logo.svg';

export const Logo: FC<ComponentPropsWithRef<'svg'>> = (props) => {
  // console.log('icon:', LogoIcon);
  // console.log('props:', props)
  // return <div className="text-green-600 font-bold text-3xl">DD</div>
  return <LogoIcon {...props} />;
};

export default Logo;
