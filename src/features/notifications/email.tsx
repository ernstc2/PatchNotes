import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Heading,
} from '@react-email/components';

interface DigestEmailProps {
  name: string;
  items: Array<{ title: string; topic: string | null; type: string; sourceUrl: string }>;
  unsubscribeUrl: string;
}

export function DigestEmail({ name, items, unsubscribeUrl }: DigestEmailProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const greeting = name && name.trim() ? `Hi ${name},` : 'Hi there,';

  return (
    <Html lang="en">
      <Head />
      <Body
        style={{
          backgroundColor: '#f9fafb',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: '0',
          padding: '0',
        }}
      >
        <Container
          style={{
            maxWidth: '560px',
            margin: '40px auto',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Section
            style={{
              backgroundColor: '#111827',
              padding: '24px 32px',
            }}
          >
            <Heading
              style={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '700',
                margin: '0 0 4px 0',
                letterSpacing: '-0.025em',
              }}
            >
              PatchNotes
            </Heading>
            <Text
              style={{
                color: '#9ca3af',
                fontSize: '13px',
                margin: '0',
              }}
            >
              Your digest for {today}
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '24px 32px' }}>
            <Text
              style={{
                fontSize: '15px',
                color: '#374151',
                margin: '0 0 16px 0',
              }}
            >
              {greeting}
            </Text>
            <Text
              style={{
                fontSize: '15px',
                color: '#374151',
                margin: '0 0 24px 0',
              }}
            >
              Here are the latest government updates matching your watchlist:
            </Text>

            {items.map((item, index) => (
              <Section
                key={index}
                style={{
                  borderLeft: '3px solid #6366f1',
                  paddingLeft: '16px',
                  marginBottom: '20px',
                }}
              >
                <Link
                  href={item.sourceUrl}
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#111827',
                    textDecoration: 'none',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  {item.title}
                </Link>
                <Text
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: '0',
                  }}
                >
                  {item.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  {item.topic ? ` · ${item.topic.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}` : ''}
                </Text>
              </Section>
            ))}
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px' }} />

          {/* Footer */}
          <Section style={{ padding: '20px 32px' }}>
            <Text
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                margin: '0 0 8px 0',
              }}
            >
              You&apos;re receiving this because of your PatchNotes watchlist.
            </Text>
            <Link
              href={unsubscribeUrl}
              style={{
                fontSize: '12px',
                color: '#6b7280',
                textDecoration: 'underline',
              }}
            >
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
