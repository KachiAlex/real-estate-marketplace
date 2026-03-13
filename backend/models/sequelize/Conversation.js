const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true
    },
    participant1Id: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true
    },
    participant2Id: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true
    },
    lastMessageId: {
      type: DataTypes.UUID
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'conversations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['propertyId', 'participant1Id', 'participant2Id'],
        name: 'unique_conversation_participants'
      },
      {
        fields: ['participant1Id', 'lastMessageAt'],
        name: 'idx_conversations_participant1_recent'
      },
      {
        fields: ['participant2Id', 'lastMessageAt'],
        name: 'idx_conversations_participant2_recent'
      }
    ]
  });

  return Conversation;
};
