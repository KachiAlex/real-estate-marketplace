const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    propertyId: {
      type: DataTypes.UUID
    },
    subject: {
      type: DataTypes.STRING
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE
    },
    editedAt: {
      type: DataTypes.DATE,
      comment: 'Last edit timestamp'
    },
    originalContent: {
      type: DataTypes.TEXT,
      comment: 'Original content before edits'
    },
    deletedAt: {
      type: DataTypes.DATE,
      comment: 'Soft delete timestamp'
    },
    deletedBy: {
      type: DataTypes.UUID,
      comment: 'User who deleted the message'
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
    tableName: 'messages',
    timestamps: true,
    indexes: [
      {
        fields: ['senderId', 'createdAt'],
        name: 'idx_messages_sender_date'
      },
      {
        fields: ['recipientId', 'isRead', 'createdAt'],
        name: 'idx_messages_recipient_read_date'
      },
      {
        fields: ['propertyId', 'createdAt'],
        name: 'idx_messages_property_date'
      },
      {
        fields: ['deletedAt'],
        name: 'idx_messages_deleted',
        where: { deletedAt: null }
      }
    ]
  });

  return Message;
};

