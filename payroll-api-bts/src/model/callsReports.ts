import mongoose, { Schema, model, Types } from "mongoose";

export interface ICallsReport extends mongoose.Document {
  user: Types.ObjectId;
  ext: string;
  from: string;
  to: string;
  status: "Answered" | "Unanswered";
  direction: "Outbound" | "Inbound" | "Internal";
  ringing: string;
  talking: string;
  cost: string;

  callTime: string;
  callDay?: string;
  callId?: string;
  endByOperator: boolean;
  isDeleted: boolean;
}

const callReportsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "User",
    },
    ext: {
      type: String,
      require: true,
    },
    from: {
      type: String,
      require: true,
    },
    to: {
      type: String,
      require: true,
    },
    status: {
      type: String,
      require: true,
    },
    direction: {
      type: String,
      require: true,
    },
    ringing: {
      type: String,
      require: true,
    },
    talking: {
      type: String,
      require: true,
    },
    cost: {
      type: String,
      require: true,
    },
    callTime: {
      type: String,
      require: false,
    },
    callDay: {
      type: String,
      require: true,
    },
    callId: {
      type: String,
      require: false,
    },
    endByOperator: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model<ICallsReport>("CallsReport", callReportsSchema);
