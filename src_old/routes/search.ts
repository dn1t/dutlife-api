import Handler from '~/handler.ts';
import { graphql } from '~/utils/graphql.ts';

export default Handler(async (req) => {
  const params = new URL(req.url).searchParams;
  const query = params.get('query') ?? undefined;

  const data = await graphql<{
    idByUsername: { id: string };
    idByNickname: { id: string };
    projectList: {
      total: number;
      list: {
        name: string;
        ranked: boolean;
        user: {
          id: string;
          username: string;
          nickname: string;
          profileImage: {
            filename: string;
            imageType: string;
          };
        };
        thumb: string;
        updated: string;
      }[];
      searchAfter: [number, number, number];
    };
  }>(
    `query ($query: String, $display: Int) {
      idByUsername: user(username: $query) {
        id
      }
      idByNickname: user(nickname: $query) {
        id
      }
      projectList(query: $query, pageParam: { sorts: ["_score", "likeCnt"], display: $display }, searchType: "scroll") {
        total
        list {
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
          updated
        }
        searchAfter
      }
    }`,
    { query, display: 16 },
  );

  console.log(data);

  return Response.json({
    total: data.projectList.total,
    list: data.projectList.list.map((item) => {
      const hasProfileImage = !!item.user.profileImage;

      return {
        name: item.name,
        user: {
          id: item.user.id,
          username: item.user.username,
          nickname: item.user.nickname,
          profileImage: hasProfileImage
            ? `https://playentry.org/uploads/${item.user.profileImage?.filename?.slice(
                0,
                2,
              )}/${item.user.profileImage?.filename?.slice(2, 4)}/${
                item.user.profileImage?.filename
              }.${item.user.profileImage?.imageType}`
            : 'https://playentry.org/img/DefaultCardUserThmb.svg',
        },
        thumb: `https://playentry.org${item.thumb}`,
        updated: item.updated,
      };
    }),
    searchAfter: data.projectList.searchAfter,
  });
});
