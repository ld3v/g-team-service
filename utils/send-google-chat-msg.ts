import { Logger } from '@nestjs/common';
import axios from 'axios';

export const sendGChatMessage = async (
  url: string,
  content: Record<string, any> | string,
) => {
  try {
    const res = await axios.post(url, content);
    return res.data;
  } catch (error: any) {
    Logger.error('Something went wrong when send G-Chat message:');
    console.error(error);
  }
};
