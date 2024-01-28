import type { FC, ComponentPropsWithRef } from 'react';

import { ReactComponent as EditIcon } from '../../assets/icons/edit.svg';

export const Edit: FC<ComponentPropsWithRef<'svg'>> = (props) => {
  return <EditIcon {...props} />;
};

export default Edit;
