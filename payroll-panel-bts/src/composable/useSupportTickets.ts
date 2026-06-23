import methodsHttp from "src/api/methodsHttp";

export const useSupportTickets = () => {
  const createSupportTicket = async (payload: {
    title: string;
    description: string;
    priority?: string;
  }) => {
    const resp = await methodsHttp.postApi("/api/support/tickets", payload);
    return resp;
  };

  const getMySupportTickets = async (params?: {
    limit?: number;
    initial?: number;
    status?: string;
    priority?: string;
    text?: string;
  }) => {
    const query = new URLSearchParams();

    if (params?.limit !== undefined) {
      query.append("limit", String(params.limit));
    }

    if (params?.initial !== undefined) {
      query.append("initial", String(params.initial));
    }

    if (params?.status) {
      query.append("status", params.status);
    }

    if (params?.priority) {
      query.append("priority", params.priority);
    }

    if (params?.text) {
      query.append("text", params.text);
    }

    const resp = await methodsHttp.getApi(
      `/api/support/tickets${query.toString() ? `?${query.toString()}` : ""}`,
    );

    return resp;
  };

  const getAllSupportTickets = async (params?: {
    limit?: number;
    initial?: number;
    status?: string;
    priority?: string;
    text?: string;
    user?: string;
  }) => {
    const query = new URLSearchParams();

    if (params?.limit !== undefined) {
      query.append("limit", String(params.limit));
    }

    if (params?.initial !== undefined) {
      query.append("initial", String(params.initial));
    }

    if (params?.status) {
      query.append("status", params.status);
    }

    if (params?.priority) {
      query.append("priority", params.priority);
    }

    if (params?.text) {
      query.append("text", params.text);
    }

    if (params?.user) {
      query.append("user", params.user);
    }

    const resp = await methodsHttp.getApi(
      `/api/support/admin/tickets${query.toString() ? `?${query.toString()}` : ""}`,
    );

    return resp;
  };

  const getSupportTicketById = async (id: string) => {
    const resp = await methodsHttp.getApi(`/api/support/tickets/${id}`);
    return resp;
  };

  const getAdminSupportTicketById = async (id: string) => {
    const resp = await methodsHttp.getApi(`/api/support/admin/tickets/${id}`);
    return resp;
  };

  const updateSupportTicketStatus = async (
    id: string,
    payload: {
      status?: string;
      responseMessage?: string;
    },
  ) => {
    const resp = await methodsHttp.putApi(
      `/api/support/admin/tickets/${id}`,
      payload,
    );
    return resp;
  };

  return {
    createSupportTicket,
    getMySupportTickets,
    getAllSupportTickets,
    getSupportTicketById,
    getAdminSupportTicketById,
    updateSupportTicketStatus,
  };
};