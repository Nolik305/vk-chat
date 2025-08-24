import React, { useState, useEffect, useRef } from 'react';
import {
  ConfigProvider,
  AdaptivityProvider,
  AppRoot,
  View,
  Panel,
  PanelHeader,
  Group,
  Input,
  Button,
  Separator,
  ModalRoot,
  ModalPage,
  ModalPageHeader,
  FormItem,
  Textarea,
} from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

import bridge from '@vkontakte/vk-bridge';
import { db } from './firebase';
import { ref, push, onValue, set, update } from 'firebase/database';

function App() {
  const [user, setUser] = useState({
    id: 'test123',
    name: 'Тест Пользователь',
    avatar: 'https://vk.com/images/camera_200.png',
    about: '',
  });
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [aboutText, setAboutText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    bridge.send('VKWebAppGetUserInfo')
      .then((data) => {
        const userData = {
          id: data.id,
          name: `${data.first_name} ${data.last_name}`,
          avatar: data.photo_200,
          about: '',
        };
        setUser(userData);
        set(ref(db, `users/${data.id}`), {
          ...userData,
          lastSeen: Date.now(),
        });
      })
      .catch(() => {
        set(ref(db, `users/test123`), {
          id: 'test123',
          name: 'Тест Пользователь',
          avatar: 'https://vk.com/images/camera_200.png',
          about: '',
          lastSeen: Date.now(),
        });
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      update(ref(db, `users/${user.id}`), {
        lastSeen: Date.now(),
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const loadedUsers = data ? Object.values(data) : [];
      setUsers(loadedUsers);
    });
  }, []);

  useEffect(() => {
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loaded = data ? Object.values(data) : [];
      setMessages(loaded.reverse());
    });
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (text.trim()) {
      let type = 'public';
      let targetId = null;

      if (text.startsWith('@')) {
        const nick = text.split(' ')[0].substring(1);
        const target = users.find(u => u.name === nick);
        if (target) {
          type = 'private';
          targetId = target.id;
        }
      }

      if (text.startsWith('$')) {
        const nick = text.split(' ')[0].substring(1);
        const target = users.find(u => u.name === nick);
        if (target) {
          type = 'mention';
          targetId = target.id;
        }
      }

      const newMessage = {
        from: user.id,
        name: user.name,
        avatar: user.avatar,
        text,
        type,
        targetId,
      };

      push(ref(db, 'messages'), newMessage);
      setText('');
    }
  };

  const visibleMessages = messages.filter(msg => {
    if (msg.type === 'public') return true;
    if (msg.type === 'mention') return true;
    if (msg.type === 'private') {
      return msg.from === user.id || msg.targetId === user.id;
    }
    return false;
  });

  const onlineUsers = users.filter(u => Date.now() - u.lastSeen < 120000);

  const handleSaveAbout = () => {
    update(ref(db, `users/${user.id}`), {
      about: aboutText,
    });
    setUser(prev => ({ ...prev, about: aboutText }));
    setActiveModal(null);
  };    const modal = (
    <ModalRoot activeModal={activeModal}>
      <ModalPage
        id="profile"
        onClose={() => setActiveModal(null)}
        header={<ModalPageHeader>Ваш профиль</ModalPageHeader>}
      >
        <Group>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <img src={user.avatar} alt="avatar" width={48} height={48} style={{ borderRadius: 24 }} />
            <div style={{ marginLeft: 12 }}>
              <strong>{user.name}</strong>
              <div style={{ fontSize: 12, color: 'gray' }}>ID: {user.id}</div>
            </div>
          </div>
          <FormItem top="О себе">
            <Textarea
              value={aboutText}
              onChange={e => setAboutText(e.target.value)}
              placeholder="Напишите немного о себе"
            />
            <Button onClick={handleSaveAbout} style={{ marginTop: 8 }}>
              Сохранить
            </Button>
          </FormItem>
        </Group>
      </ModalPage>

      <ModalPage
        id="online"
        onClose={() => setActiveModal(null)}
        header={<ModalPageHeader>Онлайн пользователи</ModalPageHeader>}
      >
        <Group>
          {onlineUsers.length === 0 && <div>Никто не онлайн 😢</div>}
          {onlineUsers.map((u, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 6,
              background: '#e7e8ec',
              padding: 6,
              borderRadius: 6
            }}>
              <img src={u.avatar} alt="avatar" width={24} height={24} />
              <div style={{ marginLeft: 8 }}>{u.name}</div>
            </div>
          ))}
        </Group>
      </ModalPage>
    </ModalRoot>
  );   return (
    <ConfigProvider>
      <AdaptivityProvider>
        <AppRoot modal={modal}>
          <View activePanel="main">
            <Panel id="main">
              <PanelHeader>VK Чат</PanelHeader>

              <Group>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  paddingBottom: 10
                }}>
                  <div ref={chatEndRef}></div>
                  {visibleMessages.map((msg, i) => {
                    const isPrivate = msg.type === 'private';
                    const isMention = msg.type === 'mention';
                    const isToMe = msg.targetId === user.id;
                    const isFromMe = msg.from === user.id;

                    const bgColor = isPrivate ? '#f3e8ff' :
                                    isMention ? '#fff8dc' : '#f2f3f5';

                    const textColor = isPrivate && (isToMe || isFromMe) ? '#6a0dad' : 'black';

                    return (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 10,
                        background: bgColor,
                        padding: 10,
                        borderRadius: 8
                      }}>
                        <img src={msg.avatar} alt="avatar" width={32} height={32} />
                        <div style={{ marginLeft: 10 }}>
                          <strong>{msg.name}</strong>
                          <div style={{ color: textColor }}>
                            {msg.text}
                          </div>
                          {isPrivate && (
                            <div style={{ fontSize: 12, color: '#6a0dad' }}>Личное сообщение</div>
                          )}
                          {isMention && isToMe && (
                            <div style={{ fontSize: 12, color: 'orange' }}>Упоминание вас</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Group>

              <Group>
                <div style={{
                  display: 'flex',                  alignItems: 'center',
                  gap: 8,
                  padding: 10
                }}>
                  {/* Кнопка профиля */}
                  <Button mode="secondary" onClick={() => {
                    setAboutText(user.about || '');
                    setActiveModal('profile');
                  }}>
                    {user.name}
                  </Button>

                  {/* Поле ввода */}
                  <Input
                    value={text}
                    onChange={e => {
                      if (e.target.value.length <= 155) {
                        setText(e.target.value);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Введите сообщение..."
                    style={{ flexGrow: 1 }}
                    multiline
                  />

                  {/* Кнопка + */}
                  <Button mode="secondary" onClick={() => setActiveModal('online')}>
                    +
                  </Button>

                  {/* Кнопка отправки */}
                  <Button
                    mode="primary"
                    onClick={handleSend}
                    disabled={!text.trim()}
                  >
                    Отправить
                  </Button>
                </div>
              </Group>
            </Panel>
          </View>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}

export default App;