### SRP 위반
class UserProfile:
    def __init__(self, user_id, name, email):
        self.user_id = user_id
        self.name = name
        self.email = email

    def get_user_details(self):
        # 사용자 정보 조회 로직 (예: DB에서 가져오기)
        print(f"Fetching details for {self.user_id} from database...")
        return {"id": self.user_id, "name": self.name, "email": self.email}

    def display_user(self):
        details = self.get_user_details() # 실제로는 DB 조회 결과일 수 있음
        # 사용자 정보를 화면에 표시하는 로직
        print(f"--- User Profile ---")
        print(f"ID: {details['id']}")
        print(f"Name: {details['name']}")
        print(f"Email: {details['email']}")

    def save_user_to_database(self):
        # 사용자 정보를 데이터베이스에 저장하는 로직
        print(f"Saving user {self.name} to database...")
        # conn.execute("INSERT INTO users ...")
        print("User saved.")

# 사용 예
# profile = UserProfile(1, "개발구루", "guru@example.com")
# profile.display_user()
# profile.save_user_to_database()

### SRP 준수
class User:
    def __init__(self, user_id, name, email):
        self.user_id = user_id
        self.name = name
        self.email = email

class UserRepository:
    def get_user_by_id(self, user_id):
        # 데이터베이스에서 사용자 정보를 조회하는 책임
        print(f"Fetching user {user_id} from database...")
        # 예시 데이터 반환
        if user_id == 1:
            #################### 의존성 역전 법칙을 어겼지만 간결함을 위해 ##############
            return User(user_id, "개발구루", "guru@example.com")
            ##############################################################
        return None

    def save(self, user: User):
        # 사용자를 데이터베이스에 저장하는 책임
        print(f"Saving user {user.name} ({user.user_id}) to database...")
        # conn.execute("INSERT OR UPDATE users ...")
        print(f"User {user.name} saved.")

class UserDisplayer:
    def display(self, user: User):
        # 사용자 정보를 표시하는 책임
        if user:
            print(f"--- User Profile ---")
            print(f"ID: {user.user_id}")
            print(f"Name: {user.name}")
            print(f"Email: {user.email}")
        else:
            print("User not found.")

# 사용 예
# user_repo = UserRepository()
# user_displayer = UserDisplayer()

# guru_user = user_repo.get_user_by_id(1)
# user_displayer.display(guru_user)

# new_user = User(2, "주니어개발자", "junior@example.com")
# user_repo.save(new_user)
# fetched_new_user = user_repo.get_user_by_id(2)
# user_displayer.display(fetched_new_user)