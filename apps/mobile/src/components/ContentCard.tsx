/**
 * ContentCard Component
 * Displays a content item in the dashboard
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Card from './ui/Card'
import Badge from './ui/Badge'
import { Content } from '../types'
import { colors } from '../theme'
import { RootStackParamList } from '../navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface ContentCardProps {
  content: Content
  workspaceId: string
}

export default function ContentCard({ content, workspaceId }: ContentCardProps) {
  const navigation = useNavigation<NavigationProp>()

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄'
      case 'youtube':
        return '▶️'
      case 'text':
        return '📝'
      default:
        return '📄'
    }
  }

  const getStatusBadge = () => {
    switch (content.status) {
      case 'processing':
        return <Badge text="Processing..." variant="warning" />
      case 'complete':
        return <Badge text="Ready" variant="success" />
      case 'error':
        return <Badge text="Error" variant="error" />
      default:
        return null
    }
  }

  const handlePress = () => {
    if (content.status === 'complete') {
      navigation.navigate('ContentDetail', {
        workspaceId,
        contentId: content.id,
      })
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={content.status !== 'complete'}
      activeOpacity={0.7}
    >
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.typeIcon}>
            <Text style={styles.icon}>{getTypeIcon(content.type)}</Text>
          </View>
          {getStatusBadge()}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {content.title}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.type}>{content.type.toUpperCase()}</Text>
          <Text style={styles.date}>
            {new Date(content.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
})
