import { FC, ReactNode, useRef } from 'react';

import clsx from 'clsx';
import { Logo, Logout } from '../../icons';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { Toaster } from 'react-hot-toast';

export interface LayoutProps {
  className?: string;
  user?: {
    name: string;
    image: string;
  };
  onSignOut?: () => void;
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({
  className = '',
  user,
  onSignOut = () => {},
  children,
}) => {
  return (
    <div
      id="layout"
      className={clsx(
        className,
        'font-sans',
        'flex min-h-screen w-screen flex-col overflow-auto bg-black'
      )}
    >
      <Toaster />
      <nav className="border-b-2 border-b-gray-800">
        <div className="m-auto flex sm:w-full items-center gap-3 sm:max-w-2xl pr-6 pl-3 md:p-0">
          <Logo className="my-4 h-8 w-8" />
          <h1 className="text-2xl text-green-500 ">Delivert</h1>
          {user ? (
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild>
                <div className="ml-auto flex cursor-pointer items-center gap-3">
                  <span className="text-sm tracking-wide text-gray-200 whitespace-nowrap text-ellipsis max-w-[13ch] sm:max-w-[40ch] overflow-hidden">
                    {user.name}
                  </span>
                  <div className="h-11 w-11 rounded-full border-2 border-gray-800">
                    <img
                      className="rounded-full object-cover"
                      src={user.image}
                      alt="avatar"
                    />
                  </div>
                </div>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal
                container={
                  typeof window !== 'undefined'
                    ? document.getElementById('layout') ?? document.body
                    : null
                }
              >
                <DropdownMenu.Content
                  align="end"
                  side="bottom"
                  sideOffset={7}
                  asChild
                >
                  <div className="bg-gray-950 overflow-hidden rounded-md border border-gray-200">
                    <DropdownMenu.Item asChild>
                      <button
                        onClick={() => {
                          onSignOut();
                        }}
                        className="flex items-center gap-6 py-1 pl-3 pr-2 font-sans hover:bg-gray-900"
                      >
                        <span className="text-base text-gray-100">
                          sign out
                        </span>
                        <Logout className="h-5 w-5 stroke-gray-100" />
                      </button>
                    </DropdownMenu.Item>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : null}
        </div>
      </nav>
      <main className="flex h-full w-full flex-grow">
        <div className="m-auto sm:max-w-2xl">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
