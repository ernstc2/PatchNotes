'use strict';

function Profile() {
  const [bookmarkedArticles, setBookmarkedArticles] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetch(`${window.base}/user/bookmarks`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        //Normalize all document types
        const normalizedExecOrders = data.order.map(normalizeExecutiveOrder);
        const normalizedRegulations = data.regulation.map(normalizeRegulation);
        const normalizedBills = data.bill.map(normalizeBill);  

        setBookmarkedArticles([
            ...normalizedBills,
            ...normalizedExecOrders,
            ...normalizedRegulations
        ]);
        console.log(data);
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  if (isLoading) {
    return React.createElement('div', {className: 'loading'}, 'Loading your bookmarks...');
  }

  if (bookmarkedArticles.length === 0) {
    return React.createElement('div', {className: 'empty'}, 'No bookmarked articles yet.');
  }

  return React.createElement(
    'div',
    {className: 'profile-container'},
    [
      React.createElement('h2', {key: 'title'}, 'Your Saved Articles'),
      React.createElement(
        'div',
        {className: 'articles-list', key: 'articles'},
        bookmarkedArticles.map(article => 
          React.createElement(Article, {
            data: article,
            key: article.id,
            showBookmark: false
          })
      )
      )
    ]
  );
}