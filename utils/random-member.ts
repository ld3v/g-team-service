export const randomMember = (
  memberDic: Record<string, string>,
  memberJoin?: string[],
  except?: string[],
): { id: string; alias: string } => {
  let members = [...Object.keys(memberDic)];
  if (memberJoin) members = members.filter((mem) => memberJoin.includes(mem));
  if (except) members = members.filter((mem) => !except.includes(mem));

  const memberCount = members.length;
  if (memberCount === 0) {
    return {
      id: '-1',
      alias: '',
    };
  }
  const keySelected = members[Math.floor(Math.random() * memberCount)];
  return {
    alias: keySelected,
    id: memberDic[keySelected],
  };
};

export const randomMemberByAlias = (memberAliases: string[]): string => {
  const memberCount = memberAliases.length;
  return memberAliases[Math.floor(Math.random() * memberCount)];
};
