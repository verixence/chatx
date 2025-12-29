/**
 * UploadModal Component
 * Main upload modal with type selection
 */

import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import Modal from './ui/Modal'
import Input from './ui/Input'
import TextArea from './ui/TextArea'
import Button from './Button'
import LoadingSpinner from './ui/LoadingSpinner'
import contentService from '../services/content'
import { colors } from '../theme'

interface UploadModalProps {
  visible: boolean
  onClose: () => void
  workspaceId: string
  onSuccess?: (contentId: string) => void
  initialType?: 'pdf' | 'youtube' | 'text'
}

type UploadType = 'pdf' | 'youtube' | 'text' | null

export default function UploadModal({
  visible,
  onClose,
  workspaceId,
  onSuccess,
  initialType,
}: UploadModalProps) {
  const [uploadType, setUploadType] = useState<UploadType>(initialType || null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('')

  // Text state
  const [textTitle, setTextTitle] = useState('')
  const [textContent, setTextContent] = useState('')

  // Sync uploadType with initialType when it changes
  useEffect(() => {
    setUploadType(initialType || null)
  }, [initialType])

  const handleClose = () => {
    setUploadType(initialType || null)
    setYoutubeUrl('')
    setTextTitle('')
    setTextContent('')
    setUploadProgress(0)
    onClose()
  }

  const handlePDFUpload = async () => {
    try {
      setIsLoading(true)
      const response = await contentService.uploadPDF(workspaceId, (progress) => {
        setUploadProgress(progress)
      })
      Alert.alert('Success', 'PDF uploaded successfully! Processing will begin shortly.')
      if (response.contentId) {
        onSuccess?.(response.contentId)
      }
      handleClose()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload PDF')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL')
      return
    }

    try {
      setIsLoading(true)
      const response = await contentService.ingestYouTube(workspaceId, youtubeUrl)
      Alert.alert('Success', 'YouTube video added! Processing transcript...')
      if (response.contentId) {
        onSuccess?.(response.contentId)
      }
      handleClose()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add YouTube video')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextUpload = async () => {
    if (!textTitle.trim() || !textContent.trim()) {
      Alert.alert('Error', 'Please enter both title and content')
      return
    }

    try {
      setIsLoading(true)
      const response = await contentService.ingestText(workspaceId, textContent, textTitle)
      Alert.alert('Success', 'Text added successfully!')
      if (response.contentId) {
        onSuccess?.(response.contentId)
      }
      handleClose()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add text')
    } finally {
      setIsLoading(false)
    }
  }

  const renderTypeSelection = () => (
    <View style={styles.typeSelection}>
      <Text style={styles.sectionTitle}>Choose Upload Type</Text>

      <TouchableOpacity
        style={styles.typeOption}
        onPress={() => setUploadType('pdf')}
        activeOpacity={0.7}
      >
        <Text style={styles.typeIcon}>📄</Text>
        <View style={styles.typeInfo}>
          <Text style={styles.typeTitle}>PDF Document</Text>
          <Text style={styles.typeDescription}>Upload a PDF file</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.typeOption}
        onPress={() => setUploadType('youtube')}
        activeOpacity={0.7}
      >
        <Text style={styles.typeIcon}>▶️</Text>
        <View style={styles.typeInfo}>
          <Text style={styles.typeTitle}>YouTube Video</Text>
          <Text style={styles.typeDescription}>Paste video URL</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.typeOption}
        onPress={() => setUploadType('text')}
        activeOpacity={0.7}
      >
        <Text style={styles.typeIcon}>📝</Text>
        <View style={styles.typeInfo}>
          <Text style={styles.typeTitle}>Paste Text</Text>
          <Text style={styles.typeDescription}>Notes, articles, etc.</Text>
        </View>
      </TouchableOpacity>
    </View>
  )

  const renderPDFUpload = () => (
    <View style={styles.uploadForm}>
      <Text style={styles.formTitle}>Upload PDF</Text>
      <Text style={styles.formDescription}>
        Select a PDF file from your device to upload and process.
      </Text>

      {isLoading ? (
        <View style={styles.uploadProgress}>
          <LoadingSpinner text={`Uploading... ${uploadProgress}%`} />
        </View>
      ) : (
        <>
          <Button
            title="Choose PDF File"
            onPress={handlePDFUpload}
            variant="primary"
            style={styles.uploadButton}
          />
          <Button
            title="Back"
            onPress={initialType ? handleClose : () => setUploadType(null)}
            variant="outline"
          />
        </>
      )}
    </View>
  )

  const renderYouTubeUpload = () => (
    <View style={styles.uploadForm}>
      <Text style={styles.formTitle}>Add YouTube Video</Text>
      <Text style={styles.formDescription}>
        Paste a YouTube video URL. We'll extract the transcript for you.
      </Text>

      <Input
        label="YouTube URL"
        value={youtubeUrl}
        onChangeText={setYoutubeUrl}
        placeholder="https://www.youtube.com/watch?v=..."
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {isLoading ? (
        <LoadingSpinner text="Processing video..." />
      ) : (
        <>
          <Button
            title="Add Video"
            onPress={handleYouTubeUpload}
            variant="primary"
            style={styles.uploadButton}
          />
          <Button
            title="Back"
            onPress={initialType ? handleClose : () => setUploadType(null)}
            variant="outline"
          />
        </>
      )}
    </View>
  )

  const renderTextUpload = () => (
    <View style={styles.uploadForm}>
      <Text style={styles.formTitle}>Paste Text</Text>
      <Text style={styles.formDescription}>
        Add your notes, articles, or any text content.
      </Text>

      <Input
        label="Title"
        value={textTitle}
        onChangeText={setTextTitle}
        placeholder="My notes..."
      />

      <TextArea
        label="Content"
        value={textContent}
        onChangeText={setTextContent}
        placeholder="Paste your text here..."
        rows={8}
      />

      {isLoading ? (
        <LoadingSpinner text="Processing text..." />
      ) : (
        <>
          <Button
            title="Add Text"
            onPress={handleTextUpload}
            variant="primary"
            style={styles.uploadButton}
          />
          <Button
            title="Back"
            onPress={initialType ? handleClose : () => setUploadType(null)}
            variant="outline"
          />
        </>
      )}
    </View>
  )

  const getModalTitle = () => {
    if (!uploadType) return 'Upload Content'
    switch (uploadType) {
      case 'pdf':
        return 'Upload PDF'
      case 'youtube':
        return 'Upload YouTube'
      case 'text':
        return 'Upload Text'
      default:
        return 'Upload Content'
    }
  }

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={getModalTitle()}
      scrollable={uploadType === 'text'}
    >
      {!uploadType && renderTypeSelection()}
      {uploadType === 'pdf' && renderPDFUpload()}
      {uploadType === 'youtube' && renderYouTubeUpload()}
      {uploadType === 'text' && renderTextUpload()}
    </Modal>
  )
}

const styles = StyleSheet.create({
  typeSelection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  uploadForm: {
    gap: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  formDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  uploadProgress: {
    paddingVertical: 32,
  },
  uploadButton: {
    marginTop: 8,
  },
})
