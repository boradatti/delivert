import type { FC, ComponentPropsWithRef } from 'react';

import { ReactComponent as DeleteIcon } from '../../assets/icons/delete.svg';

export const Delete: FC<ComponentPropsWithRef<'svg'>> = (props) => {
  return <DeleteIcon {...props} />;
};

export default Delete;
