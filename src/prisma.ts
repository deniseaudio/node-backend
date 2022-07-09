import { PrismaClient } from "@prisma/client";

import type { ValidAudioMetadata } from "./file-metadata";
import { getLastPartOfPath } from "./fs-utils";

const client = new PrismaClient();

/**
 * Find a unique user by its email.
 *
 * @param email User email.
 * @returns User or null.
 */
export const findUser = async (email: string) => {
  return client.user.findUnique({
    where: { email },
  });
};

/**
 * Find a unique user by its ID.
 *
 * @param userId User ID.
 * @returns User or null.
 */
export const findUserById = async (userId: string) => {
  return client.user.findUnique({
    where: { id: userId },
  });
};

/**
 * Create a new user.
 *
 * @param email Email.
 * @param username Username.
 * @param password Hashed password.
 * @returns Created user.
 */
export const createUser = async (
  email: string,
  username: string,
  password: string
) => {
  return client.user.create({
    data: {
      email,
      username,
      password,
    },
  });
};

/**
 * Find all user likes by user ID.
 *
 * @param userId User identifier.
 * @returns List of all songs IDs liked by the user.
 */
export const findUserLikes = async (userId: string) => {
  return client.user.findFirst({
    where: { id: userId },
    select: { likes: true },
  });
};

/**
 * Set user likes array.
 *
 * @param userId User ID.
 * @param songsIds Array of songs IDs.
 * @returns Updated user object.
 */
export const setUserLikes = async (userId: string, songsIds: string[]) => {
  return client.user.update({
    where: { id: userId },
    data: {
      likes: { set: songsIds },
    },
  });
};

/**
 * Find all root directories.
 *
 * @returns Array of Directory.
 */
export const findRootDirectories = async () => {
  return client.directory.findMany({
    where: { root: true },
    select: {
      id: true,
      name: true,
    },
  });
};

/**
 * Find a directory by its ID.
 *
 * @param id Directory ID.
 * @returns Array of Directory.
 */
export const findDirectoryContentById = async (id: string) => {
  return client.directory.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      children: {
        select: {
          id: true,
          name: true,
        },
      },
      songs: {
        include: {
          album: true,
          artist: true,
        },
      },
    },
  });
};

/**
 * Find an existing directory.
 *
 * @param directory Directory name.
 * @param path Full path with directory name.
 * @param root If true, is a root folder.
 * @returns Directory or null.
 */
export const findDirectory = async (
  directory: string,
  path: string,
  root: boolean
) => {
  return client.directory.findFirst({
    where: {
      name: { equals: directory },
      path: { equals: path },
      root: { equals: root },
    },
  });
};

/**
 * Find an existing directory, if there is none, create one.
 *
 * @param directory Directory name.
 * @param path Full path with directory name.
 * @param root If true, is a root folder.
 * @param parentDir If defined, set the parent directory as a reference.
 * @returns Directory.
 */
export const findOrCreateDirectory = async (
  directory: string,
  path: string,
  root: boolean,
  parentPath?: string
) => {
  const dir = await findDirectory(directory, path, root);

  if (dir) {
    return {
      alreadyExist: true,
      directory: dir,
    };
  }

  // If `parentPath` is defined, connect this new directory to its parent directory.
  if (parentPath) {
    const parentDir = await client.directory.findFirst({
      where: {
        path: { equals: parentPath },
      },
    });

    return client.directory
      .create({
        data: {
          name: directory,
          path,
          root,
          parents: {
            connect: { id: parentDir?.id },
          },
        },
      })
      .then((value) => ({ alreadyExist: false, directory: value }));
  }

  return client.directory
    .create({
      data: {
        name: directory,
        path,
        root,
      },
    })
    .then((value) => ({ alreadyExist: false, directory: value }));
};

/**
 * Find an existing artist.
 *
 * @param artistName Artist name.
 * @returns Artist or null.
 */
export const findArtist = async (artistName: string) => {
  return client.artist.findFirst({
    where: { name: artistName },
  });
};

/**
 * Find an existing artist, if there is none, create one.
 *
 * @param artistName Artist name.
 * @returns Artist.
 */
export const findOrCreateArtist = async (artistName: string) => {
  const artist = await findArtist(artistName);

  if (artist) {
    return artist;
  }

  return client.artist.create({
    data: { name: artistName },
  });
};

/**
 * Find an existing album.
 *
 * @param albumName Album name.
 * @returns Album or null.
 */
export const findAlbum = async (albumName: string) => {
  return client.album.findFirst({
    where: { name: albumName },
  });
};

/**
 * Find an existing album, if there is none, create one.
 *
 * @param albumName Album name.
 * @returns Album.
 */
export const findOrCreateAlbum = async (albumName: string) => {
  const album = await findAlbum(albumName);

  if (album) {
    return album;
  }

  return client.album.create({
    data: { name: albumName },
  });
};

/**
 * Find a song by its ID.
 *
 * @param id Song ID.
 * @returns Song or null.
 */
export const findSongById = (id: string) => {
  return client.song.findFirst({
    where: { id },
    include: {
      artist: true,
      album: true,
      directory: true,
    },
  });
};

/**
 * Find an existing song.
 *
 * @param file Entire file path with extension.
 * @returns Song or null.
 */
export const findSong = async (file: string) => {
  return client.song.findFirst({
    where: {
      path: { equals: file },
    },
    include: {
      artist: true,
      album: true,
    },
  });
};

/**
 * Find songs by their IDs.
 *
 * @param songsIds Array of songs IDs.
 * @returns Array of songs.
 */
export const findSongsById = async (songsIds: string[]) => {
  return client.song.findMany({
    where: { id: { in: songsIds } },
  });
};

/**
 * Create a song if it doesn't exist. Will create required artist and albums if
 * needed.
 *
 * @param metadata ValidAudioMetadata.
 * @param songpath Full path to the song.
 * @param folderpath Full path to the song directory.
 * @returns Song or null (if it already exists).
 */
export const createSong = async (
  metadata: ValidAudioMetadata,
  songpath: string,
  folderpath: string
) => {
  const song = await findSong(songpath);

  if (song) {
    return null;
  }

  const foldername = getLastPartOfPath(folderpath)!;
  const filename = getLastPartOfPath(songpath)!;

  const artist = await findOrCreateArtist(metadata.common.artist);
  const album = await findOrCreateAlbum(metadata.common.album);
  const { directory } = await findOrCreateDirectory(
    foldername,
    folderpath,
    false
  );

  return client.song.create({
    data: {
      path: songpath,
      filename,
      title: metadata.common.title,
      length: metadata.format.duration,
      codec: metadata.format.codec,
      artist: {
        connect: { id: artist.id },
      },
      album: {
        connect: { id: album.id },
      },
      directory: {
        connect: { id: directory.id },
      },
    },
  });
};
