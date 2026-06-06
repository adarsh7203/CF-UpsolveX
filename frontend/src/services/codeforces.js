export const fetchUserRating = async (handle) => {
  try {
    const res = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}&lang=en`);
    const data = await res.json();
    if (data.status === 'OK') {
      return data.result;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch rating:", error);
    return [];
  }
};

export const fetchUserInfo = async (handle) => {
  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}&lang=en`);
    const data = await res.json();
    if (data.status === 'OK') {
      return data.result[0];
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return null;
  }
};

export const fetchContests = async () => {
  try {
    const res = await fetch(`https://codeforces.com/api/contest.list?lang=en`);
    const data = await res.json();
    if (data.status === 'OK') {
      return data.result;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch contests:", error);
    return [];
  }
};
