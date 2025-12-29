/**
 * SummaryView Component
 * Displays AI-generated summary and content preview
 */

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { WebView } from 'react-native-webview'
import LoadingSpinner from './ui/LoadingSpinner'
import Card from './ui/Card'
import contentService from '../services/content'
import { Content } from '../types'
import { colors } from '../theme'

interface SummaryViewProps {
  content: Content
}

export default function SummaryView({ content }: SummaryViewProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
    if (content.type === 'pdf') {
      fetchPDFUrl()
    }
  }, [content.id])

  const fetchSummary = async () => {
    try {
      setIsLoading(true)
      const processed = await contentService.getProcessedContent(content.id)

      if (processed && processed.summary) {
        setSummary(processed.summary)
      } else if (content.extracted_text) {
        // Fallback to extracted text if no AI summary yet
        setSummary(content.extracted_text)
      } else {
        setSummary('Summary will appear here once processing is complete.')
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
      setSummary(content.extracted_text || 'Failed to load summary')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPDFUrl = async () => {
    try {
      const url = await contentService.getPDFUrl(content.id)
      setPdfUrl(url)
    } catch (error) {
      console.error('Error fetching PDF URL:', error)
    }
  }

  const renderContentPreview = () => {
    switch (content.type) {
      case 'pdf':
        return pdfUrl ? (
          <Card style={styles.previewCard}>
            <Text style={styles.previewTitle}>PDF Preview</Text>
            <View style={styles.pdfContainer}>
              <WebView
                source={{ uri: pdfUrl }}
                style={styles.webView}
                startInLoadingState
                renderLoading={() => <LoadingSpinner text="Loading PDF..." />}
              />
            </View>
          </Card>
        ) : null

      case 'youtube':
        return content.raw_url ? (
          <Card style={styles.previewCard}>
            <Text style={styles.previewTitle}>Video Preview</Text>
            <View style={styles.videoContainer}>
              <WebView
                source={{ uri: content.raw_url }}
                style={styles.webView}
                startInLoadingState
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
              />
            </View>
          </Card>
        ) : null

      case 'text':
        return (
          <Card style={styles.previewCard}>
            <Text style={styles.previewTitle}>Original Text</Text>
            <ScrollView style={styles.textContainer}>
              <Text style={styles.textContent}>{content.extracted_text}</Text>
            </ScrollView>
          </Card>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading summary..." />
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Summary Section */}
      <Card variant="elevated" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryIcon}>📝</Text>
          <Text style={styles.summaryTitle}>AI Summary</Text>
        </View>
        <Text style={styles.summaryText}>{summary}</Text>
      </Card>

      {/* Content Preview */}
      {renderContentPreview()}

      {/* Metadata */}
      <Card style={styles.metadataCard}>
        <Text style={styles.metadataTitle}>Details</Text>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Type:</Text>
          <Text style={styles.metadataValue}>{content.type.toUpperCase()}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Created:</Text>
          <Text style={styles.metadataValue}>
            {new Date(content.created_at).toLocaleDateString()}
          </Text>
        </View>
        {content.file_size && (
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Size:</Text>
            <Text style={styles.metadataValue}>
              {(content.file_size / 1024 / 1024).toFixed(2)} MB
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  previewCard: {
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  pdfContainer: {
    height: 400,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
  },
  textContainer: {
    maxHeight: 300,
  },
  textContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  webView: {
    flex: 1,
  },
  metadataCard: {
    marginBottom: 16,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metadataLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
})
