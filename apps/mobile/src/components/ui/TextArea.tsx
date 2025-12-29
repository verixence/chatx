/**
 * TextArea Component
 * Multi-line text input
 */

import React from 'react'
import Input from './Input'
import { TextInputProps } from 'react-native'

interface TextAreaProps extends TextInputProps {
  label?: string
  error?: string
  rows?: number
}

export default function TextArea({ rows = 4, ...props }: TextAreaProps) {
  return (
    <Input
      {...props}
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
      style={{ minHeight: rows * 24 }}
    />
  )
}
