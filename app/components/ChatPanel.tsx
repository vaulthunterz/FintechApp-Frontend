import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import aiService from '../services/aiService';

interface ChatPanelProps {
  onClose?: () => void;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you with your finances today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(1));
  const scrollViewRef = useRef<ScrollView>(null);

  const togglePanel = () => {
    const toValue = isOpen ? 0 : 1;
    setIsOpen(!isOpen);
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: false,
      friction: 8,
    }).start();

    if (!isOpen && onClose) {
      onClose();
    }
  };

  const handleChatbotRequest = async () => {
    if (!prompt.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a message'
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: prompt,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setPrompt('');

    // Scroll to bottom after adding user message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      setLoading(true);

      // Get previous messages for context (excluding the latest user message)
      const context = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      // Call the AI service to get a response
      const response = await aiService.getChatbotResponse(userMessage.text, context);

      // Extract the response text
      let botResponse = response.text || "I'm not sure how to help with that yet.";

      // Fallback to hardcoded responses if AI service fails
      if (!botResponse || botResponse.trim() === '') {
        const lowerPrompt = userMessage.text.toLowerCase();

        if (lowerPrompt.includes('expense') || lowerPrompt.includes('spend')) {
          botResponse = "Based on your recent transactions, your highest spending category is Food & Dining.";
        } else if (lowerPrompt.includes('budget') || lowerPrompt.includes('save')) {
          botResponse = "I recommend setting a monthly budget for discretionary spending. Would you like me to help you create one?";
        } else if (lowerPrompt.includes('invest') || lowerPrompt.includes('investment')) {
          botResponse = "I can provide basic investment advice. What specific information are you looking for?";
        } else if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
          botResponse = "Hello! How can I assist with your financial questions today?";
        }
      }

      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Scroll to bottom after adding bot response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error("Error in chatbot:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to get chatbot response'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: 'Hello! How can I help you with your finances today?',
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setPrompt('');
  };

  const panelHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 400], // Adjust the max height as needed
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View style={[styles.container, { height: panelHeight }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={togglePanel}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>AI Assistant</Text>
        <View style={styles.headerButtons}>
          {isOpen && (
            <TouchableOpacity
              style={styles.clearIcon}
              onPress={clearChat}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <Ionicons
            name={isOpen ? 'chevron-down' : 'chevron-up'}
            size={24}
            color="#fff"
          />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <ScrollView
            style={styles.messagesContainer}
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userBubble : styles.botBubble
                ]}
              >
                <Text style={styles.messageText}>{message.text}</Text>
                <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              value={prompt}
              onChangeText={setPrompt}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                loading && styles.sendButtonDisabled
              ]}
              onPress={handleChatbotRequest}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <Ionicons name="hourglass" size={20} color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Adjusted to be above the FABs
    right: 20, // Positioned on the right side
    width: 300, // Fixed width for the chat panel
    maxWidth: '80%', // But not too wide on smaller screens
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1976d2',
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearIcon: {
    marginRight: 10,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 5,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 10,
    maxHeight: 80,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#1976d2',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
});

export default ChatPanel;