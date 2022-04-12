import passport from 'passport';
import { BasicStrategy } from 'passport-http';
import config from '../../common/config';

passport.use(new BasicStrategy((userid, password, done) => {
  const user = config.serverUser;
  if (user && userid == user.username && password == user.password) {
    return done(null, user);
  }
  return done(null, false);
}));

export default passport;
