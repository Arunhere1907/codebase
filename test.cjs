const axios = require('axios');

axios.post('https://leetcode.com/graphql', {
  query: `query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      badges { id name displayName icon }
      activeBadge { id name displayName icon }
    }
  }`,
  variables: { username: 'neal_wu' }
}).then(r => console.log(JSON.stringify(r.data, null, 2))).catch(e => console.error(e.response?.data || e.message));
