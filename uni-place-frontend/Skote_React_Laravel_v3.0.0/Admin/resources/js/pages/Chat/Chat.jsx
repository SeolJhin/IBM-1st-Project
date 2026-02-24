import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Col, Container, Row, } from "reactstrap";

//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";
import ChatList from "./ChatList";
import UserChat from "./UserChat";

import { getMessages as onGetMessages } from "../../store/actions";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

const Chat = () => {

  //meta title
  document.title = "Chat | Skote React + Laravel Admin And Dashboard Template";

  const dispatch = useDispatch();
  const chatSelector = createSelector(
    state => state.chat,
    chat => ({
      messages: chat.messages,
      loading: chat.loading
    })
  );

  const { messages, loading } = useSelector(chatSelector);

  const [currentRoomId, setCurrentRoomId] = useState(1);
  const [Chat_Box_Username, setChat_Box_Username] = useState("Steven Franklin");
  const [Chat_Box_User_Status, setChat_Box_User_Status] = useState("online");

  useEffect(() => {
    dispatch(onGetMessages(currentRoomId));
  }, [onGetMessages, currentRoomId]);

  //Use For Chat Box
  const userChatOpen = (chats) => {
    setChat_Box_Username(chats.name);
    setChat_Box_User_Status(chats.status);
    setCurrentRoomId(chats.roomId);
    dispatch(onGetMessages(chats.roomId));
  };


  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Render Breadcrumb */}
          <Breadcrumbs title="Skote" breadcrumbItem="Chat" />

          <Row>
            <Col lg="12">
              <div className="d-lg-flex">
                <ChatList
                  userChatOpen={userChatOpen}
                  currentRoomId={currentRoomId} />

                <UserChat
                  Chat_Box_Username={Chat_Box_Username}
                  Chat_Box_User_Status={Chat_Box_User_Status}
                  messages={messages}
                  loading={loading}
                />
              </div>
            </Col>
          </Row >
        </Container>
      </div>
    </React.Fragment>
  );
};

Chat.propTypes = {
  chats: PropTypes.array,
  groups: PropTypes.array,
  contacts: PropTypes.array,
  messages: PropTypes.array,
  onGetChats: PropTypes.func,
  onGetGroups: PropTypes.func,
  onGetContacts: PropTypes.func,
  onGetMessages: PropTypes.func,
  onAddMessage: PropTypes.func,
};

export default Chat;
