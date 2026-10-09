import React from 'react';
import {
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface FormattedAlertBodyProps {
  html?: string;
  fallbackText?: string;
  isDarkMode?: boolean;
  maxBlocks?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

interface InlineSpan {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  linkUrl: string | null;
}

interface Block {
  type: 'h1' | 'h2' | 'p' | 'ul' | 'ol';
  items?: string[];
  content?: string;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&bull;/gi, '•')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ');
}

function parseHtmlBlocks(rawContent: string): Block[] {
  if (!rawContent || !rawContent.trim()) return [];

  // Normalize line breaks
  let cleaned = rawContent.replace(/<br\s*\/?>/gi, '\n');

  // Match block-level elements
  const blockRegex = /<(h1|h2|ul|ol|p|div)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>/gi;
  const blocks: Block[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      const interstitial = cleaned.slice(lastIndex, match.index).trim();
      if (interstitial && interstitial.replace(/<[^>]*>/g, '').trim()) {
        blocks.push({ type: 'p', content: interstitial });
      }
    }

    const tag = match[1].toLowerCase() as 'h1' | 'h2' | 'ul' | 'ol' | 'p' | 'div';
    const inner = match[2].trim();

    if (tag === 'ul' || tag === 'ol') {
      const items: string[] = [];
      const liRegex = /<li(?:\s+[^>]*)?>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(inner)) !== null) {
        const liContent = liMatch[1].trim();
        if (liContent) items.push(liContent);
      }
      if (items.length > 0) {
        blocks.push({ type: tag, items });
      }
    } else if (tag === 'h1' || tag === 'h2') {
      if (inner) blocks.push({ type: tag, content: inner });
    } else {
      if (inner) blocks.push({ type: 'p', content: inner });
    }

    lastIndex = blockRegex.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    const remaining = cleaned.slice(lastIndex).trim();
    if (remaining && remaining.replace(/<[^>]*>/g, '').trim()) {
      blocks.push({ type: 'p', content: remaining });
    }
  }

  // Fallback: If no HTML tags were present or found
  if (blocks.length === 0) {
    const rawParagraphs = cleaned.split(/\n{2,}|\r\n\r\n/);
    for (const p of rawParagraphs) {
      const trimmed = p.trim();
      if (!trimmed) continue;

      // Detect bullet list lines
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.includes('&bull;')) {
        const lines = trimmed
          .split(/\n/)
          .map((l) => l.replace(/^[•\-\s]+|&bull;\s*/, '').trim())
          .filter(Boolean);
        blocks.push({ type: 'ul', items: lines });
      } else {
        blocks.push({ type: 'p', content: trimmed });
      }
    }
  }

  return blocks;
}

function parseInlineSpans(content: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const tagRegex = /(<(\/)?(strong|b|em|i|u|a)(?:\s+[^>]*href=["']([^"']*)["'][^>]*)?[^>]*>)/gi;
  let lastIndex = 0;
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let linkUrl: string | null = null;

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const rawText = content.slice(lastIndex, match.index);
      const text = decodeEntities(rawText.replace(/<[^>]*>/g, ''));
      if (text) {
        spans.push({ text, isBold, isItalic, isUnderline, linkUrl });
      }
    }

    const isClosing = match[2] === '/';
    const tag = match[3].toLowerCase();
    const href = match[4];

    if (tag === 'strong' || tag === 'b') isBold = !isClosing;
    else if (tag === 'em' || tag === 'i') isItalic = !isClosing;
    else if (tag === 'u') isUnderline = !isClosing;
    else if (tag === 'a') linkUrl = isClosing ? null : href || null;

    lastIndex = tagRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    const rawText = content.slice(lastIndex);
    const text = decodeEntities(rawText.replace(/<[^>]*>/g, ''));
    if (text) {
      spans.push({ text, isBold, isItalic, isUnderline, linkUrl });
    }
  }

  return spans.length > 0
    ? spans
    : [{ text: decodeEntities(content.replace(/<[^>]*>/g, '')), isBold: false, isItalic: false, isUnderline: false, linkUrl: null }];
}

export function FormattedAlertBody({
  html,
  fallbackText,
  isDarkMode = false,
  maxBlocks,
  containerStyle,
}: FormattedAlertBodyProps) {
  const sourceText = (html && html.trim().length > 0) ? html : (fallbackText || '');
  const allBlocks = parseHtmlBlocks(sourceText);
  const blocksToRender = maxBlocks ? allBlocks.slice(0, maxBlocks) : allBlocks;

  const textColor = isDarkMode ? '#CBD5E1' : '#334155';
  const headingColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const linkColor = '#0F53D1';

  const renderInline = (content: string, baseStyle?: StyleProp<TextStyle>) => {
    const spans = parseInlineSpans(content);
    return spans.map((span, sIdx) => {
      const handlePress = span.linkUrl
        ? () => {
            if (span.linkUrl) Linking.openURL(span.linkUrl).catch(() => {});
          }
        : undefined;

      return (
        <Text
          key={sIdx}
          onPress={handlePress}
          style={[
            baseStyle,
            span.isBold && styles.boldText,
            span.isItalic && styles.italicText,
            span.isUnderline && styles.underlineText,
            span.linkUrl && [styles.linkText, { color: linkColor }],
          ]}
        >
          {span.text}
        </Text>
      );
    });
  };

  if (blocksToRender.length === 0) {
    return (
      <View style={containerStyle}>
        <Text style={[styles.paragraph, { color: textColor }]}>
          {fallbackText || ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {blocksToRender.map((block, bIdx) => {
        if (block.type === 'h1') {
          return (
            <Text key={bIdx} style={[styles.heading1, { color: headingColor }]}>
              {renderInline(block.content || '', [styles.heading1, { color: headingColor }])}
            </Text>
          );
        }

        if (block.type === 'h2') {
          return (
            <Text key={bIdx} style={[styles.heading2, { color: headingColor }]}>
              {renderInline(block.content || '', [styles.heading2, { color: headingColor }])}
            </Text>
          );
        }

        if (block.type === 'ul' && block.items) {
          return (
            <View key={bIdx} style={styles.listContainer}>
              {block.items.map((item, iIdx) => (
                <View key={iIdx} style={styles.listItemRow}>
                  <Text style={[styles.bulletPoint, { color: isDarkMode ? '#38BDF8' : '#0F53D1' }]}>
                    •
                  </Text>
                  <Text style={[styles.listItemText, { color: textColor }]}>
                    {renderInline(item, [styles.paragraph, { color: textColor }])}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'ol' && block.items) {
          return (
            <View key={bIdx} style={styles.listContainer}>
              {block.items.map((item, iIdx) => (
                <View key={iIdx} style={styles.listItemRow}>
                  <Text style={[styles.numberedIndex, { color: isDarkMode ? '#38BDF8' : '#0F53D1' }]}>
                    {iIdx + 1}.
                  </Text>
                  <Text style={[styles.listItemText, { color: textColor }]}>
                    {renderInline(item, [styles.paragraph, { color: textColor }])}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        // Paragraph block
        return (
          <Text key={bIdx} style={[styles.paragraph, { color: textColor }]}>
            {renderInline(block.content || '', [styles.paragraph, { color: textColor }])}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  heading1: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 4,
  },
  heading2: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 2,
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  listContainer: {
    marginVertical: 2,
    gap: 4,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 4,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  numberedIndex: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    minWidth: 16,
  },
  listItemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
