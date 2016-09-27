import { TwitterStatus } from './twitter-status.component'

export class TwitterProfile {
  id: number;
  name: string;
  username: string;
  description: string;
  followers_count: string;
  friends_count: string;
  images: {
    profile: string,
    banner: string
  };
  status: TwitterStatus;
}
