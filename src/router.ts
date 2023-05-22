import { initTRPC } from '@trpc/server';
import z from 'zod';
import { graphql } from './utils/graphql.ts';

const { procedure, router } = initTRPC.create();

export const appRouter = router({
  search: procedure
    .input(z.object({ query: z.string(), display: z.number() }))
    .query(async ({ input: { query, display } }) => {
      const data = await graphql<{
        searchUserByUsername: {
          id: string;
          username: string;
          nickname: string;
          description: string;
          profileImage: { filename: string; imageType: string };
          coverImage: { filename: string; imageType: string };
          status: { following: number; follower: number };
          badges: { label: string; image: string }[];
        };
        searchUserByNickname: {
          id: string;
          username: string;
          nickname: string;
          description: string;
          profileImage: { filename: string; imageType: string };
          coverImage: { filename: string; imageType: string };
          status: { following: number; follower: number };
          badges: { label: string; image: string }[];
        };
        searchProjects: {
          total: number;
          list: {
            id: string;
            name: string;
            ranked: boolean;
            user: {
              id: string;
              username: string;
              nickname: string;
              profileImage: { filename: string; imageType: string };
            };
            thumb: string;
            updated: string;
            visit: number;
            likeCnt: number;
            comment: number;
          }[];
          searchAfter: [number, number, number];
        };
        searchDiscuss: {
          total: number;
          list: {
            id: string;
            title: string;
            content: string;
            user: {
              id: string;
              username: string;
              nickname: string;
              profileImage: { filename: string; imageType: string };
            };
            category: string;
            created: string;
            visit: number;
            likesLength: number;
            commentsLength: number;
            bestComment: {
              id: string;
              content: string;
              user: {
                id: string;
                username: string;
                nickname: string;
                profileImage: { filename: string; imageType: string };
              };
              likesLength: number;
            };
          }[];
          searchAfter: [number, number, number];
        };
      }>(
        `query ($query: String, $display: Int) {
        searchUserByUsername: user(username: $query) {
          id
          username
          nickname
          description
          profileImage {
            filename
            imageType
          }
          coverImage {
            filename
            imageType
          }
          status {
            following
            follower
          }
        }
        searchUserByNickname: user(nickname: $query) {
          id
          username
          nickname
          description
          profileImage {
            filename
            imageType
          }
          coverImage {
            filename
            imageType
          }
          status {
            following
            follower
          }
        }
        searchProjects: projectList(
          query: $query
          pageParam: { sorts: ["_score", "likeCnt"], display: $display }
          searchType: "scroll"
        ) {
          total
          list {
            id
            name
            user {
              id
              username
              nickname
              profileImage {
                filename
                imageType
              }
            }
            thumb
            category
            updated
            visit
            likeCnt
            comment
          }
          searchAfter
        }
        searchDiscuss: discussList(
          pageParam: { sort: "score", display: $display }
          query: $query
          searchType: "scroll"
        ) {
          total
          list {
            id
            title
            content
            user {
              id
              username
              nickname
              profileImage {
                filename
                imageType
              }
            }
            category
            created
            visit
            likesLength
            commentsLength
            bestComment {
              id
              content
              user {
                id
                username
                nickname
                profileImage {
                  filename
                  imageType
                }
              }
              likesLength
            }
          }
          searchAfter
        }
      }`,
        { query, display },
      );

      console.log(data);

      const users: {
        id: string;
        username: string;
        nickname: string;
        description: string;
        profileImage?: string;
        coverImage?: string;
        followers: number;
        followings: number;
        badges: { label: string; image: string }[];
      }[] = [];

      const isSameUser =
        data.searchUserByUsername &&
        data.searchUserByNickname &&
        data.searchUserByUsername.id === data.searchUserByNickname.id;

      const badgeDataPromises: (
        | Promise<{
            userContestPrizes: {
              contest: { name: string };
              badgeText: string;
              bannerImageData: { path: string };
            }[];
          }>
        | Promise<undefined>
      )[] = [Promise.resolve(undefined), Promise.resolve(undefined)];

      if (data.searchUserByUsername)
        badgeDataPromises[0] = graphql<{
          userContestPrizes: {
            contest: { name: string };
            badgeText: string;
            bannerImageData: { path: string };
          }[];
        }>(
          `query ($id: String!) {
        userContestPrizes(id: $id) {
          contest {
            name
          }
          badgeText
          bannerImageData {
            path
          }
        }
      }
      `,
          { id: data.searchUserByUsername.id },
        );
      if (!isSameUser && data.searchUserByNickname)
        badgeDataPromises[1] = graphql<{
          userContestPrizes: {
            contest: { name: string };
            badgeText: string;
            bannerImageData: { path: string };
          }[];
        }>(
          `query ($id: String!) {
          userContestPrizes(id: $id) {
            contest {
              name
            }
            badgeText
            bannerImageData {
              path
            }
          }
        }
        `,
          { id: data.searchUserByNickname.id },
        );

      const [usernameBadgeData, nicknameBadgeData] = await Promise.all(
        badgeDataPromises,
      );

      if (data.searchUserByUsername) {
        const user = data.searchUserByUsername;

        users.push({
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          description: user.description,
          profileImage: user.profileImage
            ? `https://playentry.org/uploads/${user.profileImage?.filename?.slice(
                0,
                2,
              )}/${user.profileImage?.filename?.slice(2, 4)}/${
                user.profileImage?.filename
              }.${user.profileImage?.imageType}`
            : undefined,
          coverImage: user.coverImage
            ? `https://playentry.org/uploads/${user.coverImage?.filename?.slice(
                0,
                2,
              )}/${user.coverImage?.filename?.slice(2, 4)}/${
                user.coverImage?.filename
              }.${user.coverImage?.imageType}`
            : undefined,
          followers: user.status.follower,
          followings: user.status.following,
          badges:
            usernameBadgeData?.userContestPrizes.map((prize) => ({
              label: `${prize.contest.name} - ${prize.badgeText}`,
              image: `https://playentry.org/uploads${prize.bannerImageData.path}`,
            })) ?? [],
        });
      }
      if (!isSameUser && data.searchUserByNickname) {
        const user = data.searchUserByNickname;

        users.push({
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          description: user.description,
          profileImage: user.profileImage
            ? `https://playentry.org/uploads/${user.profileImage?.filename?.slice(
                0,
                2,
              )}/${user.profileImage?.filename?.slice(2, 4)}/${
                user.profileImage?.filename
              }.${user.profileImage?.imageType}`
            : undefined,
          coverImage: user.coverImage
            ? `https://playentry.org/uploads/${user.coverImage?.filename?.slice(
                0,
                2,
              )}/${user.coverImage?.filename?.slice(2, 4)}/${
                user.coverImage?.filename
              }.${user.coverImage?.imageType}`
            : undefined,
          followers: user.status.follower,
          followings: user.status.following,
          badges:
            nicknameBadgeData?.userContestPrizes.map((prize) => ({
              label: `${prize.contest.name} - ${prize.badgeText}`,
              image: `https://playentry.org/uploads${prize.bannerImageData.path}`,
            })) ?? [],
        });
      }

      const projects: {
        total: number;
        searchAfter: [number, number, number];
        list: {
          id: string;
          name: string;
          user: {
            id: string;
            username: string;
            nickname: string;
            profileImage?: string;
          };
          thumb?: string;
          updated: string;
          views: number;
          likes: number;
          comments: number;
        }[];
      } = {
        total: data.searchProjects.total,
        searchAfter: data.searchProjects.searchAfter,
        list: data.searchProjects.list.map((project) => {
          return {
            id: project.id,
            name: project.name,
            user: {
              id: project.user.id,
              username: project.user.username,
              nickname: project.user.nickname,
              profileImage: project.user.profileImage
                ? `https://playentry.org/uploads/${project.user.profileImage?.filename?.slice(
                    0,
                    2,
                  )}/${project.user.profileImage?.filename?.slice(2, 4)}/${
                    project.user.profileImage?.filename
                  }.${project.user.profileImage?.imageType}`
                : undefined,
            },
            thumb: project.thumb
              ? `https://playentry.org${
                  project.thumb.startsWith('/')
                    ? project.thumb
                    : `/${project.thumb}`
                }`
              : undefined,
            updated: project.updated,
            views: project.visit,
            likes: project.likeCnt,
            comments: project.comment,
          };
        }),
      };

      const discuss: {
        total: number;
        searchAfter: [number, number, number];
        list: {
          id: string;
          title: string;
          content: string;
          user: {
            id: string;
            username: string;
            nickname: string;
            profileImage?: string;
          };
          category: string;
          created: string;
          views: number;
          likes: number;
          comments: number;
          bestComment?: {
            id: string;
            content: string;
            user: {
              id: string;
              username: string;
              nickname: string;
              profileImage?: string;
            };
            likes: number;
          };
        }[];
      } = {
        total: data.searchDiscuss.total,
        searchAfter: data.searchDiscuss.searchAfter,
        list: data.searchDiscuss.list.map((discuss) => {
          return {
            id: discuss.id,
            title: discuss.title,
            content: discuss.content,
            user: {
              id: discuss.user.id,
              username: discuss.user.username,
              nickname: discuss.user.nickname,
              profileImage: discuss.user.profileImage
                ? `https://playentry.org/uploads/${discuss.user.profileImage?.filename?.slice(
                    0,
                    2,
                  )}/${discuss.user.profileImage?.filename?.slice(2, 4)}/${
                    discuss.user.profileImage?.filename
                  }.${discuss.user.profileImage?.imageType}`
                : undefined,
            },
            category: discuss.category,
            created: discuss.created,
            views: discuss.visit,
            likes: discuss.likesLength,
            comments: discuss.commentsLength,
            bestComment: discuss.bestComment
              ? {
                  id: discuss.bestComment.id,
                  content: discuss.bestComment.content,
                  user: {
                    id: discuss.bestComment.user.id,
                    username: discuss.bestComment.user.username,
                    nickname: discuss.bestComment.user.nickname,
                    profileImage: discuss.bestComment.user.profileImage
                      ? `https://playentry.org/uploads/${discuss.bestComment.user.profileImage?.filename?.slice(
                          0,
                          2,
                        )}/${discuss.bestComment.user.profileImage?.filename?.slice(
                          2,
                          4,
                        )}/${discuss.bestComment.user.profileImage?.filename}.${
                          discuss.bestComment.user.profileImage?.imageType
                        }`
                      : undefined,
                  },
                  likes: discuss.bestComment.likesLength,
                }
              : undefined,
          };
        }),
      };

      return {
        users,
        projects,
        discuss,
      };
    }),
});

export type AppRouter = typeof appRouter;
