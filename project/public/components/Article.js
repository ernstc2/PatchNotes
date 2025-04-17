'use strict';

let allArticles = [];
let setShowLoginPopup = () => { };

// Normalize functions
function normalizeExecutiveOrder(eo) {
    return {
        id: eo._id,
        type: "Executive Order",
        title: eo.title,
        latestAction: {
            text: `Executive Order ${eo.executive_order_number}`,
            actionDate: new Date(eo.signing_date).toLocaleDateString()
        },
        meta: eo
    };
}

function normalizeRegulation(reg) {
    return {
        id: reg._id,
        type: "Regulation",
        title: reg.title,
        latestAction: {
            text: `Docket: ${reg.docketId || 'N/A'}`,
            actionDate: new Date(reg.postedDate).toLocaleDateString()
        },
        meta: reg
    };
}

function normalizeBill(bill) {
    return {
        id: bill._id,
        type: "Bill",
        title: bill.title,
        latestAction: {
            text: bill.action_text,
            actionDate: bill.action_date
        },
        meta: bill
    };
}

// Article component
function Article({ data }) {
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
      setIsBookmarked(bookmarks.includes(data.id));
  }, [data.id]);

  const toggleBookmark = async () => {
      try {
          const newBookmarkedState = !isBookmarked;
          setIsBookmarked(newBookmarkedState);

          const bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
          const updated = newBookmarkedState
              ? [...bookmarks, data.id]
              : bookmarks.filter(id => id !== data.id);

          localStorage.setItem('bookmarkedArticles', JSON.stringify(updated));


            const response = await fetch(`${window.base}/data/bookmark`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: {$oid: data.id},
                    type: data.type.toLowerCase(),
                })
            });

          const result = await response.json();
          if (!response.ok) throw new Error(result.message || 'Failed to update bookmark');

          console.log(result.message);
      } catch (err) {
          console.error('Bookmark error:', err);
          setIsBookmarked(isBookmarked);
      }
  };

  const handleAction = async () => {
      setLoading(true);
      try {
          const prompt = `Summarize this government article title in plain English:\n"${data.title}"`;

          const response = await fetch(`${window.base}/summarize`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ prompt })
          });

          const result = await response.json();
          setSummary(result.summary || 'No summary available.');
      } catch (err) {
          console.error("Summarization error:", err);
          setSummary("Failed to get summary.");
      } finally {
          setLoading(false);
      }
  };

  return React.createElement(
      'div',
      { className: 'article-card' },
      [
          React.createElement(
              'button',
              {
                  className: `bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`,
                  onClick: toggleBookmark,
                  'aria-label': isBookmarked ? 'Remove bookmark' : 'Add bookmark'
              },
              React.createElement(
                  'svg',
                  {
                      width: '20',
                      height: '20',
                      viewBox: '0 0 24 24',
                      fill: isBookmarked ? 'currentColor' : 'none',
                      stroke: 'currentColor',
                      strokeWidth: '2'
                  },
                  React.createElement('path', {
                      d: 'M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z'
                  })
              )
          ),
          React.createElement(
              'div',
              { className: 'article-card-heading' },
              [
                  React.createElement('h4', { className: 'article-card-heading-classification' }, data.type),
                  React.createElement(
                      'button',
                      {
                          className: 'action-btn',
                          onClick: handleAction,
                          disabled: loading,
                          'aria-label': 'Summarize article'
                      },
                      loading ? 'Summarizing...' : 'Summarize With Gemini'
                  ),
                  React.createElement('h4', { className: 'article-card-heading-date' }, data.latestAction.actionDate.substring(0, 10))
              ]
          ),
          React.createElement(
              'div',
              { className: 'article-card-body' },
              [
                  React.createElement('h5', { className: 'article-card-body-content' }, data.latestAction.text),
                  React.createElement('h3', { className: 'article-card-body-title' }, data.title),
                  summary && React.createElement('p', { className: 'article-summary' }, summary)
              ]
          )
      ]
  );
}


function LoginPopup() {
    const [visible, setVisible] = React.useState(false);
    const [mode, setMode] = React.useState('login'); // 'login' or 'register'
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState(null);
    const [message, setMessage] = React.useState(null);

    React.useEffect(() => {
        setShowLoginPopup = setVisible;
        window.triggerLoginPopup = () => {
            setMode('login'); // default to login when opened
            setVisible(true);
        };
    }, []);

    async function handleAuth(e) {
        e.preventDefault();
        setError(null);
        setMessage(null);

        const endpoint = mode === 'login' ? '/user/login' : '/user/register';
        const options = {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        };

        try {
            const response = await fetch(endpoint, options);
            const data = await response.json();
            console.log(`${mode} response:`, data);

            if (response.ok) {
                setMessage(`${mode === 'login' ? 'Login' : 'Registration'} successful!`);
                setTimeout(() => {
                    setVisible(false);
                    setEmail('');
                    setPassword('');
                }, 1000);
            } else {
                setError(data.message || `${mode} failed`);
            }
        } catch (err) {
            console.error(`${mode} error:`, err);
            setError('An error occurred. Please try again.');
        }
    }

    if (!visible) return null;

    const title = mode === 'login' ? 'Welcome Back' : 'Join PatchNotes';
    const subtitle = mode === 'login' ? 'Log in to continue' : 'Create an account to get started';
    const actionLabel = mode === 'login' ? 'Log In' : 'Register';
    const toggleText = mode === 'login' ? "Register" : "Already have an account?";

    return React.createElement(
        'div',
        { className: 'login-popup-overlay' },
        React.createElement(
            'div',
            { className: 'login-popup' },
            [
                React.createElement(
                    'button',
                    {
                        className: 'popup-close-btn',
                        onClick: () => setVisible(false),
                        'aria-label': 'Close popup'
                    },
                    '×'
                ),
                React.createElement('h3', null, title),
                React.createElement('p', null, subtitle),
                error && React.createElement('p', { className: 'login-error' }, error),
                message && React.createElement('p', { className: 'login-success' }, message),
                React.createElement('input', {
                    type: 'email',
                    placeholder: 'Email',
                    id: mode === 'login' ? 'userLogin' : 'userRegister',
                    className: 'login-input',
                    value: email,
                    onChange: e => setEmail(e.target.value)
                }),
                React.createElement('input', {
                    type: 'password',
                    placeholder: 'Password',
                    id: mode === 'login' ? 'passLogin' : 'passRegister',
                    className: 'login-input',
                    value: password,
                    onChange: e => setPassword(e.target.value)
                }),
                React.createElement(
                    'button',
                    {
                        onClick: handleAuth,
                        className: 'login-action-btn'
                    },
                    actionLabel
                ),
                React.createElement(
                    'div',
                    { className: 'login-links' },
                    [
                        mode === 'login'
                            ? React.createElement('a', { href: '/forgot-password' }, 'Forgot Password?')
                            : null,
                        ' ',
                        React.createElement(
                            'a',
                            {
                                href: '#',
                                onClick: e => {
                                    e.preventDefault();
                                    setMode(mode === 'login' ? 'register' : 'login');
                                    setError(null);
                                    setMessage(null);
                                }
                            },
                            toggleText
                        )
                    ]
                )
            ]
        )
    );
}

// Display all articles and popup
function displayArticles(root, data) {
    root.render(
        React.createElement(
            React.Fragment,
            null,
            React.createElement(LoginPopup),
            React.createElement(
                'div',
                { id: 'article-container' },
                data.map((article, index) =>
                    React.createElement(Article, { data: article, key: article.id  })
                )
            )
        )
    );
    window.displayArticles = displayArticles;
}

document.getElementById('login-btn')?.addEventListener('click', (e) => {
    e.preventDefault(); // prevent link navigation
    if (window.triggerLoginPopup) {
        window.triggerLoginPopup();
    }
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("logout").addEventListener("click", function() {
        const options = {
            method: "POST"
        }
        fetch(`${window.base}/user/logout`, options).then(response => response.json()).then(data => {
            alert(JSON.stringify(data, null, 2));
        });
    });
}); 