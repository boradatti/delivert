import clsx from 'clsx';
import type { NextPage, GetServerSidePropsContext } from 'next';
import { signIn, useSession, getSession } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';

import { api, type RouterOutputs } from '../utils/api';
import Image from 'next/image';

import { Check, Close, Delete, More, Time } from '@deliverdaniel/ui';

import * as Toggle from '@radix-ui/react-toggle';

import { FC, useState, useRef, useReducer, useEffect } from 'react';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CollectionMode } from 'packages/db/src/lib/prisma/types';

import * as Dialog from '@radix-ui/react-dialog';

import { toast } from 'react-hot-toast';

type Collections = RouterOutputs['spotify']['getCollectedPlaylists'];
type Collection = Collections[number];

type CollectionsMenuProps = {
  collections: Collections;
};

const CollectionsMenu: FC<CollectionsMenuProps> = ({ collections }) => {
  return (
    <>
      <CollectionList collections={collections} />
      <AddCollection hasItems={collections.length > 0} />
    </>
  );
};

type AddCollectionProps = {
  hasItems: boolean;
};

const AddCollection: FC<AddCollectionProps> = ({ hasItems }) => {
  const [playlistInput, setPlaylistInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const trpc = api.useContext();
  const session = useSession();

  const { isLoading, mutate: addPlaylist } =
    api.spotify.addCollection.useMutation({
      onMutate: () => {
        toast.loading('fetching...', {
          id: 'add-playlist',
        });
      },
      onSuccess: () => {
        trpc.spotify.getCollectedPlaylists.invalidate({
          userId: session.data!.user.id,
        });
        setDialogOpen(false);
        toast.success('collection added', {
          id: 'add-playlist',
        });
      },
      onError: ({ message }) => {
        toast.error(message.toLowerCase(), {
          id: 'add-playlist',
        });
      },
    });

  const canSubmit = !isLoading && playlistInput.length > 0;

  function submitHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    addPlaylist({ identifier: playlistInput });
  }

  return (
    <div className="flex flex-grow flex-col items-center justify-center gap-3">
      <span className="text-sm text-gray-400">
        {hasItems ? 'no more collections' : 'no collections yet'}
      </span>
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Trigger asChild>
          <button className="rounded-xl bg-gray-100 py-2 px-6 text-xl hover:bg-opacity-90">
            add
          </button>
        </Dialog.Trigger>
        <Dialog.Portal
          container={
            typeof window !== 'undefined'
              ? document.getElementById('layout') ?? document.body
              : null
          }
        >
          <Dialog.Overlay asChild>
            <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm"></div>
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <div className="bg-gray-950 fixed top-[50%] bottom-[50%] left-[50%] flex min-h-fit w-[22rem] translate-x-[-50%] translate-y-[-50%] flex-col rounded-lg border-2 border-gray-500 px-3 py-2 pb-4 sm:w-96">
              <div className="flex justify-between">
                <Dialog.Title asChild>
                  <h1 className="mb-4 text-lg font-bold text-gray-50">
                    add collection
                  </h1>
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="group h-fit rounded-md px-2 py-2 hover:bg-gray-900 hover:bg-opacity-50">
                    <Close className="h-5 w-5 fill-gray-300 group-hover:fill-gray-100" />
                  </button>
                </Dialog.Close>
              </div>
              <form
                className="flex justify-between gap-3"
                onSubmit={submitHandler}
              >
                <div className="flex flex-grow flex-col">
                  <label
                    className="mb-1 text-base text-gray-300"
                    htmlFor="playlist"
                  >
                    playlist ID or link
                  </label>
                  <input
                    autoFocus
                    value={playlistInput}
                    onChange={(e) => setPlaylistInput(e.target.value)}
                    className="rounded-md border-2 border-gray-800 bg-gray-900 bg-opacity-40 py-1 px-2 text-sm text-white focus-within:outline-none"
                    type="text"
                  />
                </div>
                <button
                  disabled={!canSubmit}
                  type="submit"
                  className="self-end rounded-lg bg-gray-100 bg-opacity-75 px-4 py-1 text-base hover:bg-opacity-80"
                >
                  add
                </button>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

type CollectionListProps = {
  collections: Collections;
};

type CollectionAddAction = {
  type: 'ADD';
  payload: Collection;
};

type CollectionRemoveAction = {
  type: 'REMOVE';
  payload: string;
};

type CollectionUpdateAction = {
  type: 'UPDATE';
  payload: Collections;
};

type CollectionAction =
  | CollectionAddAction
  | CollectionRemoveAction
  | CollectionUpdateAction;

const CollectionList: FC<CollectionListProps> = ({ collections }) => {
  const [collectionList, dispatch] = useReducer(
    (state: Collections, action: CollectionAction) => {
      switch (action.type) {
        case 'ADD':
          return [...state, action.payload].sort((a, b) =>
            a.added > b.added ? -1 : 1
          );
        case 'REMOVE':
          return state.filter((item) => item.id !== action.payload);
        case 'UPDATE':
          return action.payload;
        default:
          return state;
      }
    },
    collections
  );
  const [collectionBeingDeleted, setCollectionBeingDeleted] = useReducer(
    (_: Collection | null, id: string) => {
      return collections.find((item) => item.id === id) || null;
    },
    null
  );

  const trpc = api.useContext();
  const session = useSession();

  useEffect(() => {
    dispatch({ type: 'UPDATE', payload: collections });
  }, [collections]);

  const { mutate: removeItem } = api.spotify.removeCollection.useMutation({
    onMutate({ collectionId }) {
      console.log('MUTATING');
      setCollectionBeingDeleted(collectionId);
      dispatch({ type: 'REMOVE', payload: collectionId });
    },
    onSuccess() {
      console.log('SUCCESS!');
      trpc.spotify.getCollectedPlaylists.invalidate({
        userId: session.data!.user.id,
      });
    },
    onError() {
      console.log('ERROR!');
      dispatch({ type: 'ADD', payload: collectionBeingDeleted! });
    },
  });

  function removeHandler(options: { id: string; unfollowPlaylist: boolean }) {
    removeItem({
      collectionId: options.id,
      unfollowPlaylist: options.unfollowPlaylist,
    });
  }

  return (
    <>
      {collectionList.map((item) => (
        <CollectionItem key={item.id} {...item} onRemove={removeHandler} />
      ))}
    </>
  );
};

type CollectionProps = Collection & {
  onRemove: (options: { id: string; unfollowPlaylist: boolean }) => void;
};

const CollectionItem: FC<CollectionProps> = ({
  id,
  name,
  cover,
  mode,
  collecting,
  onRemove,
}) => {
  const subContentRef = useRef<HTMLDivElement>(null);

  const [togglePressed, setTogglePressed] = useState(collecting);
  const [collectionMode, setCollectionMode] = useState(mode);
  const [prevCollectionMode, setPrevCollectionMode] = useState(mode);
  const [unfollowPlaylist, setUnfollowPlaylist] = useState(false);

  const { variables: collectingVars, mutate: mutateCollecting } =
    api.spotify.toggleCollecting.useMutation({
      onMutate: () => {
        setTogglePressed(!togglePressed);
      },
      onSuccess: () => {
        console.log('SUCCESS!');
      },
      onError: () => {
        console.log('ERROR!');
        setTogglePressed(!collectingVars!.collecting);
      },
    });

  function toggleChangeHandler(pressed: boolean) {
    mutateCollecting({
      collectionId: id,
      collecting: pressed,
    });
  }

  const { variables: mutateModeVars, mutate: mutateMode } =
    api.spotify.changeCollectionMode.useMutation({
      onMutate: ({ mode }) => {
        console.log('MUTATING');
        setCollectionMode(mode);
      },
      onSuccess: () => {
        console.log('SUCCESS!');
        setPrevCollectionMode(mutateModeVars!.mode);
      },
      onError: () => {
        console.log('ERROR!');
        setCollectionMode(prevCollectionMode);
      },
    });

  function modeChangeHandler(mode: CollectionMode) {
    mutateMode({
      collectionId: id,
      mode,
    });
  }

  function removeHandler() {
    onRemove({
      id,
      unfollowPlaylist,
    });
  }

  return (
    <li className="flex gap-3 border-b-2 border-b-gray-900 px-4 py-2 first:pt-3">
      <div className="h-14 w-14 overflow-hidden rounded-lg border-2 border-gray-900">
        <Image
          src={cover}
          alt={name}
          width={70}
          height={70}
          className="h-full w-full rounded-[6px] object-cover object-center brightness-90"
        />
      </div>
      <div className="flex flex-col">
        <h3 className="text-sm text-gray-50 sm:text-base">{name}</h3>
        <span className="text-sm text-gray-500">
          {collectionMode.toLowerCase()}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3 self-center">
        <Toggle.Root
          pressed={togglePressed}
          onPressedChange={toggleChangeHandler}
          className="flex"
          asChild
        >
          <Toggle.Toggle asChild>
            <button
              className={clsx(
                togglePressed ? 'bg-green-500' : 'bg-gray-300',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2'
              )}
            >
              <span className="sr-only">Use setting</span>
              <span
                aria-hidden="true"
                className={clsx(
                  togglePressed ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )}
              />
            </button>
          </Toggle.Toggle>
        </Toggle.Root>
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger
            onPointerDown={(e) => {
              // @ts-ignore
              e.target.setPointerCapture(e.pointerId);
            }}
            asChild
          >
            <button className="group rounded-md px-1 py-1 hover:bg-gray-900 hover:bg-opacity-70">
              <More className="h-6 w-6 fill-gray-300 group-hover:fill-gray-100" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal
            container={
              typeof window !== 'undefined'
                ? document.getElementById('layout') ?? document.body
                : null
            }
          >
            <DropdownMenu.Content
              align="start"
              side="left"
              sideOffset={-32}
              asChild
            >
              <div className="bg-gray-950 overflow-hidden rounded-md border border-gray-200">
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger asChild>
                    <div className="flex cursor-pointer items-center gap-6 py-1 pl-3 pr-2 font-sans hover:bg-gray-700 hover:bg-opacity-30">
                      <span className="flex-grow text-base text-gray-100">
                        reschedule
                      </span>
                      <Time className="h-5 w-5 fill-gray-100" />
                    </div>
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.SubContent ref={subContentRef} asChild>
                    <DropdownMenu.RadioGroup
                      value={collectionMode}
                      onValueChange={modeChangeHandler as (s: string) => void}
                      asChild
                    >
                      <div
                        className={clsx(
                          'bg-gray-950 overflow-hidden rounded-md border border-gray-200',
                          'data-[side=right]:translate-x-[-3px] data-[side=right]:translate-y-[-1px] data-[side=right]:rounded-tl-none',
                          'data-[side=left]:translate-x-[3px] data-[side=left]:translate-y-[-1px] data-[side=left]:rounded-tr-none'
                        )}
                      >
                        <DropdownMenu.RadioItem value={CollectionMode.DAILY}>
                          <div
                            className={clsx(
                              'flex cursor-pointer items-center gap-6 py-1 px-2 font-sans hover:bg-gray-700 hover:bg-opacity-30'
                            )}
                          >
                            <span className="flex-grow text-base text-gray-100">
                              daily
                            </span>
                            <DropdownMenu.ItemIndicator asChild>
                              <span className="text-white">•</span>
                            </DropdownMenu.ItemIndicator>
                          </div>
                        </DropdownMenu.RadioItem>
                        <DropdownMenu.RadioItem value={CollectionMode.WEEKLY}>
                          <div
                            className={clsx(
                              'flex cursor-pointer items-center gap-6 py-1 px-2 font-sans hover:bg-gray-700 hover:bg-opacity-30'
                            )}
                          >
                            <span className="flex-grow text-base text-gray-100">
                              weekly
                            </span>
                            <DropdownMenu.ItemIndicator asChild>
                              <span className="text-white">•</span>
                            </DropdownMenu.ItemIndicator>
                          </div>
                        </DropdownMenu.RadioItem>
                        <DropdownMenu.RadioItem value={CollectionMode.MONTHLY}>
                          <div
                            className={clsx(
                              'flex cursor-pointer items-center gap-6 py-1 px-2 font-sans hover:bg-gray-700 hover:bg-opacity-30'
                            )}
                          >
                            <span className="flex-grow text-base text-gray-100">
                              monthly
                            </span>
                            <DropdownMenu.ItemIndicator asChild>
                              <span className="text-white">•</span>
                            </DropdownMenu.ItemIndicator>
                          </div>
                        </DropdownMenu.RadioItem>
                      </div>
                    </DropdownMenu.RadioGroup>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
                <DropdownMenu.Item asChild>
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <div className="flex cursor-pointer items-center gap-6 py-1 pl-3 pr-2 font-sans hover:bg-gray-700 hover:bg-opacity-30">
                        <span className="flex-grow text-base text-gray-100">
                          remove
                        </span>
                        <Delete className="h-5 w-5 stroke-gray-100" />
                      </div>
                    </Dialog.Trigger>
                    <Dialog.Portal
                      container={
                        typeof window !== 'undefined'
                          ? document.getElementById('layout') ?? document.body
                          : null
                      }
                    >
                      <Dialog.Overlay asChild>
                        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm"></div>
                      </Dialog.Overlay>
                      <Dialog.Content asChild>
                        <div className="bg-gray-950 fixed top-[50%] bottom-[50%] left-[50%] flex min-h-fit w-[22rem] translate-x-[-50%] translate-y-[-50%] flex-col rounded-lg border-2 border-gray-500 px-3 py-2 pb-4 sm:w-96">
                          <div className="flex justify-between">
                            <Dialog.Title asChild>
                              <h1 className="mb-4 text-lg font-bold text-gray-200">
                                are you sure?
                              </h1>
                            </Dialog.Title>
                            <Dialog.Close asChild>
                              <button className="group h-fit rounded-md px-2 py-2 hover:bg-gray-900 hover:bg-opacity-50">
                                <Close className="h-5 w-5 fill-gray-300 group-hover:fill-gray-100" />
                              </button>
                            </Dialog.Close>
                          </div>
                          <p className="mb-2 text-gray-100">
                            this is irreversible
                          </p>
                          <div className="mt flex justify-between">
                            <Toggle.Root
                              asChild
                              pressed={unfollowPlaylist}
                              onPressedChange={setUnfollowPlaylist}
                            >
                              <div className="group flex cursor-pointer items-end gap-2">
                                <Toggle.Toggle asChild>
                                  <div className="flex h-5 w-5 items-center justify-center border-2 border-gray-600 bg-gray-900 bg-opacity-50 hover:bg-opacity-20">
                                    <Check className="h-4 w-4 fill-gray-50 group-data-[state=off]:hidden" />
                                  </div>
                                </Toggle.Toggle>
                                <span className="text-sm text-gray-400">
                                  unfollow playlist
                                </span>
                              </div>
                            </Toggle.Root>
                            <button
                              type="submit"
                              className="self-end rounded-lg bg-gray-100 bg-opacity-80 px-4 py-1 text-base hover:bg-opacity-90"
                              onClick={removeHandler}
                            >
                              yes
                            </button>
                          </div>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </DropdownMenu.Item>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </li>
  );
};

// ------------------

type PageProps = {};

const HomePage: NextPage<PageProps> = () => {
  const session = useSession();

  const { status, data: collections } =
    api.spotify.getCollectedPlaylists.useQuery(
      { userId: session.data?.user.id! },
      {
        enabled: !!session.data?.user.id,
      }
    );

  return (
    <div className={clsx('flex w-full items-center justify-center')}>
      {session.status === 'unauthenticated' ? (
        <button
          onClick={() => {
            signIn('spotify');
          }}
          className={clsx(
            'rounded-full bg-green-500 py-2 px-7 text-xl font-bold text-black hover:bg-green-600'
          )}
        >
          sign in
        </button>
      ) : null}
      {session.status === 'authenticated' ? (
        <div className="flex min-h-[70vh] w-screen flex-col border-t border-b border-gray-400 sm:w-[80vw] sm:min-w-[30rem] sm:max-w-[1000px] sm:rounded-lg sm:border">
          {status === 'success' ? (
            <CollectionsMenu collections={collections} />
          ) : null}
          {status === 'loading' ? (
            <div className="w-full p-5 text-center text-white">Loading...</div>
          ) : null}
          {status === 'error' ? (
            <div className="w-full p-5 text-center text-white">Error</div>
          ) : null}
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession({
    ctx: context,
  });

  return {
    props: {
      session,
    },
  };
}

export default HomePage;
