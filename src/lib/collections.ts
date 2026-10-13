import { getCollection } from 'astro:content';
import { filterPublished, sortApps, sortHobbies, sortProjects } from './content-utils';

const showDrafts = import.meta.env.DEV;

/** Published projects, newest first (see sortProjects for the tie-break rules). */
export async function getProjects() {
  return sortProjects(filterPublished(await getCollection('projects'), showDrafts));
}

export async function getHobbies() {
  return sortHobbies(filterPublished(await getCollection('hobbies'), showDrafts));
}

export async function getApps() {
  return sortApps(filterPublished(await getCollection('apps'), showDrafts));
}
