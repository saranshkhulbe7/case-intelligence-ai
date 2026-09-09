import { AppError } from "../utils/app-error";
import { db } from "../utils/db";

function makeTitle(content: string) {
  return content.length <= 80 ? content : `${content.slice(0, 77)}...`;
}
export async function sendMessage(
  userId: string,
  chatId: string | null,
  clientMessageId: string,
  content: string,
) {
  const existingMessage = await db.message.findUnique({
    where: {
      clientMessageId,
    },
    include: {
      chat: true,
      triggeredRun: true,
    },
  });
  if (existingMessage) {
    if (
      existingMessage.chat.userId !== userId ||
      !existingMessage.triggeredRun
    ) {
      throw new AppError(409, "Message id is already in use");
    }
    return {
      chat: existingMessage.chat,
      message: existingMessage,
      run: existingMessage.triggeredRun,
    };
  }

  return db.$transaction(async (tx) => {
    const chat = chatId
      ? await tx.chat.findFirst({
          where: {
            id: chatId,
            userId,
          },
        })
      : await tx.chat.create({
          data: {
            userId,
            title: makeTitle(content),
          },
        });
    if (!chat) {
      throw new AppError(404, "Chat not found");
    }
    if (chat.activeRunId) {
      throw new AppError(409, "This chat already has an active run");
    }

    const message = await tx.message.create({
      data: {
        chatId: chat.id,
        clientMessageId,
        role: "USER",
        status: "COMPLETED",
        content,
      },
    });

    const run = await tx.run.create({
      data: {
        chatId: chat.id,
        triggerMessageId: message.id,
      },
    });

    const claimedChat = await tx.chat.updateMany({
      where: {
        id: chat.id,
        userId,
        activeRun: null,
      },
      data: {
        activeRunId: run.id,
      },
    });

    if (claimedChat.count === 0) {
      throw new AppError(409, "This chat already has an active run");
    }

    await tx.runEvent.create({
      data: {
        runId: run.id,
        type: "RUN_CREATED",
        message: "Run created",
      },
    });

    await tx.outboxEvent.create({
      data: {
        type: "ENQUEUE_RUN",
        payload: {
          runId: run.id,
        },
      },
    });

    const updatedChat = await tx.chat.findUniqueOrThrow({
      where: {
        id: chat.id,
      },
    });

    return {
      chat: updatedChat,
      message,
      run,
    };
  });
}

export async function listChats(userId: string) {
  return db.chat.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      activeRunId: true,
      createdAt: true,
      updatedAt: true,
      activeRun: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });
}

export async function getChat(userId: string, chatId: string) {
  const chat = await db.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
      runs: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          events: {
            orderBy: {
              createdAt: "asc",
            },
          },
          questionGroups: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              questions: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      },
    },
  });
  if (!chat) {
    throw new AppError(404, "Chat not found");
  }
  return chat;
}
