# restful接口规范
----
**非Rest设计**，以往我们都会这么写：

[http://localhost:8080/admin/getUser](https://links.jianshu.com/go?to=http%3A%2F%2Flocalhost%3A8080%2Fadmin%2FgetUser "http://localhost:8080/admin/getUser") （查询用户）

[http://localhost:8080/admin/addUser](https://links.jianshu.com/go?to=http%3A%2F%2Flocalhost%3A8080%2Fadmin%2FaddUser "http://localhost:8080/admin/addUser") （新增用户）

[http://localhost:8080/admin/updateUser](https://links.jianshu.com/go?to=http%3A%2F%2Flocalhost%3A8080%2Fadmin%2FupdateUser "http://localhost:8080/admin/updateUser") （更新用户）

[http://localhost:8080/admin/deleteUser](https://links.jianshu.com/go?to=http%3A%2F%2Flocalhost%3A8080%2Fadmin%2FdeleteUser "http://localhost:8080/admin/deleteUser") （删除用户）

**总结：**以不同的URL（主要为使用动词）进行不同的操作。

**Rest架构：**

GET [http://localhost:8080/admin/user](https://links.jianshu.com/go?to=http%3A%2F%2Flocalhost%3A8080%2Fadmin%2Fuser "http://localhost:8080/admin/user") （查询用户）

POST [http://localhost:8080/admin/user](https://links.jianshu.com/go?to=http%3A%2F%2Flocalhost%3A8080%2Fadmin%2Fuser "http://localhost:8080/admin/user") （新增用户）

PUT [http://localhost:8080/admin/user](https://links.jianshu.com/go?to=http%3A%2F%2Flocalhost%3A8080%2Fadmin%2Fuser "http://localhost:8080/admin/user") （更新用户）

DELETE [http://localhost:8080/admin/user](https://links.jianshu.com/go?to=http%3A%2F%2Flocalhost%3A8080%2Fadmin%2Fuser "http://localhost:8080/admin/user") （删除用户）

总结：**URL只指定资源，以HTTP方法动词进行不同的操作。用HTTP STATUS/CODE定义操作结果。Restful：遵守了rest风格的web服务便可称为Restful。
==面向资源==
```python
"""  
接口规范：  
/book/      GET         查看所有资源，返回所有资源  
/book/      POST        添加资源，返回添加资源  
/book/      GET         查看某个资源，返回这个资源  
/book/      PUT         编辑某个资源，返回编辑之后的资源  
/book/      DELETE      删除某个资源，返回空  
"""
```

# DRF序列化与反序列化
---
## 序列化器
- 序列化：序列化器会把模型对象转换成字典，经过response后变成json字符串
- 反序列化：把客户端发送过来的数据经过requset后变成字典，序列化器可以把字段转化位模型
- 反序列化完成数据校验功能
----

```python

from django.views import View  
from rest_framework.views import APIView  
  # django的cbv模式
class BookView(View):  
    def get(self, requset):  
        pass  
  
    def post(self, requset):  
        pass  
  
    def delete(self, requset):  
        pass
	# DEF的cbv模式
class BookView(APIView):  
    def get(self, requset):  
        pass  
  
    def post(self, requset):  
        pass  
  
    def delete(self, requset):  
        pass

这两个功能是一样的
```

```python

from rest_framework.views import APIView  
from .models import user_info  
from rest_framework import serializers  # 序列化  
from rest_framework.response import Response
from rest_framework.views import APIView  
from .models import user_info  
from rest_framework import serializers  # 序列化  
from rest_framework.response import Response  
from rest_framework.generics import GenericAPIView

from rest_framework.mixins import ListModelMixin, CreateModelMixin, UpdateModelMixin, DestroyModelMixin, \  
    RetrieveModelMixin  
from rest_framework.generics import GenericAPIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
```

序列化器实例
### 基于APIView
```python
from rest_framework import serializers  # 序列化
from rest_framework.views import APIView 

# 针对model设计序列化器
class BookSerializers(serializers.Serializer):
	# 序列化器的字段类型必须与model里的相同，字段的名称不要求
	# 每个字段的(参数)限制可以与model不同，但是最好相同，这个是用来验证数据的
	# 这里的字段如果注释一个(随意的不受限制),那么在下面的绿色代码块哪里就不会构建此字段
	# 虽然传过来的数据可以通过这个，但是如果数据库字段有其它要求，一切以数据库要求为准
	title = serializers.CharField(max_length=32)  
	prive = serializers.IntgerField(required=False)  # 这个字段可以省略，如果没有这个参数则不可缺少
	data = serializers.DateField(source=pub_data)  # 如果字段名和model的不一样则这也操作，
	# source值为model里的，data为别名

	# 刚开开要忽略这俩个方法，下面会慢慢引入
	# 下面这段是save的源码
	# 这意味着调用BookSerializers的save的时候会根据情况调用
	# 有instance调用update反之调用create
 '''if self.instance is not None:  
	    self.instance = self.update(self.instance, validated_data)  
	    assert self.instance is not None, (  
	        '`update()` did not return an object instance.'  
	    )  
	else:  
	    self.instance = self.create(validated_data)  
	    assert self.instance is not None, (  
	        '`create()` did not return an object instance.'  
	    )
	'''
	# 这个方法是在调用save方法所被save调用的	
	def create(self, validated_data):
		new_book = Book.obkects.create(**serializer.validated_data)
		# 这个return不写也可以正常运行，但是create会返回None会影响后续操作如下post所示
		return new_book
		
	def update(self, instance, validated_data):
		BooK.objects.filter(pk=instance.pk).update(**serializer.vaildater_data)
		# 这里直接返回的是更新前的数据，因为instance传的是 Book.objects.get(pk=book_id)
		# return Response(serializer.data) 
		# 要传更新后的数据则要这样操作
		updated_book = Book.objects.get(pk = book_id)
		
		return updated_book  # 这里返回moel的原因和上面一样

class BookNiew(APIView):

	def get(self, request):
		# 获取所有的数据
		book_list = Book.objects.all()  # Book为model类，这里book_list为queryset[A,A0,..]
		# 构建序列化器
		# instance 为需要序列化的数据(序列化传的)，many为是否处理多条数据
		serializer = BookSerializers(instance=book_list, many=True)
		'''
		这个serializer会执行以下大概步骤
		temp = []
		for obj in book_list:
			d = {}
			d['title'] = obj.title
			d['prive'] = obj.prive
			d['pub_data'] = obj.pub_data
			temp.append(d)
		'''
		# return HttpResponse(serializer.data) 如果用这个，数据可读性非常差
		# if self.instance is not None and not getattr(self, '_errors', None):  
		#   self._data = self.to_representation(self.instance)
		return Response(serializer.data)  # 这里源码里的instance就是在这里传入的
	
	反序列化
	def  post(self, request):
		# 构建序列化器对象
		# data 为需要序列化的数据(序列化传的)，many为是否处理多条数据	
		serializer = BookSerializers(data=request.data)  # 这里的reques为新的request
		# 校验数据
		if serializer.is_valid():  # 此方法返回bool值，所有字段通过返回True
			# 通过serializer校验的数据都在
			# 数据通过麻将数据插入数据库validated_data里，不通过的都在errors里
			# 如果调用serializer.save()，这句话就可以不要了(放在序列化器的create方法)
			new_book = Book.obkects.create(**serializer.validated_data)
			
			'''这里如果要调用save()方法，
			那么得在序列化器BookSerializers里实现父类的create方法，
			因为在源码里要求create必须实现，而save会调用create
			具体操作如上序列化器所示
			如果create方法不写返回值回影响后续操作
			比如 print(obj.title)
			serializer.data 这个属性方法是create返回的instance'''
			
			# 以下为源码，调用save之后会将create的返回值作为instance
			# self.instance = self.create(validated_data)  
			
			obj = serializer.save()
			
			# 按照规范要将添加的数据返回
			'''serializer是针对instance做序列化的,但这里BookSerializers我们没有传入instance
				之所以还可以调用serializer.data就是因为在调用save的时候将create的返回值
				在源码的内部将instance赋值了既self.instance = self.create(validated_data)  
			'''
			return serializer.data  # Serializer类里只有一个instance，如果没有传值那就为None，如果调用save则将BookSerializers的create的返回值作为instense
		else:
			# 校验失败
			return Response(serializer.errors)
''' 这里在创一个类是因为，使用正则路由会传入一个参数，而python不支持重载，所以需要在造一个类'''
class BookNiew(APIView):
	def get(self, request, book_id):
		book = Book.objects.get(pk=book_id)  # pk---primarykey get返回值为model对象，
		# filter返回值为queryset
		# 序列化传instance，反序列化传data
		
		serializer = BookSerializers(instance=book)
		return Response(serializer.data)
		
	def put(self, request, book_id):
		# 获取更新数据
		print("data",request.data)  # requset为API封装的request
		update_book = Book.objects.get(pk=book_id)  # 要更新的书
		# 构建序列化器对象
		''' 这里两个都要传的原因是BookSerializers序列化时针对instance的
			如果不传instance只传data是无法完成序列化的因为没有instance
		'''
		serializer = BookSerializers(instance=update_book, data=request.data)
		if serializer.is_vaile():
			# 更新逻辑
			# 这里update的返回值为更新记录的条数
			BooK.objects.filter(pk=book_id).update(**serializer.vaildater_data)
			# 这里直接返回的是更新前的数据，因为instance传的是 Book.objects.get(pk=book_id)
			# return Response(serializer.data) 
			# 要传更新后的数据则要这样操作
			# 下面这两行是为了返回更新后的数据
			updated_book = Book.objects.get(pk = book_id)
			serializer.instance = updated_book  # 更新instance
			
			# 调用这个方法，因为此例传入instance所以会调用serializer重写的update方法
			# 因此上面三行代码就放在update里，所以这里就不需要了
			serializer.save() 
			return Response(serializer.data) 
		else:
			return Resopnse(serializer.errors)
		
	def delete(self, request, book_id):
		Book.objects.get(pd=book_id).delete()
		return Response()
```

## ModelSerializer
```python

class BookSerializer(serializers.modelSerializer):
	date = serializers.DateField(source="pub_date")  # 这个单独写在这里的原因是要给字段改名
	class Meta:
		model = Book  # 序列化器的模型
		# fields = "__all__"  # 这里的fields不能和exclude一块用 
		# fields = ["id", "name", "price"]
		exclude = ["pub_date"]  # 不要pub_date其他的都要

# 下面的业务逻辑和上面的相同
# 但是这个更好，这个考虑到了一对多，多对多
```
### 基于modelSerializer 的序列化器

```python
from rest_framework.generics import GenericAPIView
class BookSerializer(serializers.modelSerializer):
	date = serializers.DateField(source="pub_date")  
	class Meta:
		model = Book  
		exclude = ["pub_date"]  # 不要pub_date其他的都要

class Book(GenericAPIView):
	# GenericAPIView继承APIView
	
```

### 基于GenericAPIView 通用视图
这个GenericAPIView主要是因为有多个model类时，只有序列化器不同其他的业务逻辑时相同的，因此会造成代码冗余，这是就需要GenericAPIView了
```python
from rest_framework.generics import GenericAPIView
class BookSerializer(serializers.modelSerializer):
	date = serializers.DateField(source="pub_date")  
	class Meta:
		model = Book  
		exclude = ["pub_date"]  # 不要pub_date其他的都要

class BookView(GenericAPIView):
	# GenericAPIView继承APIView
	queryset = Book.objects.all()
	serializer_class = BookSerializer
	def get(self, request):
		# 构建序列化器
		# serializer = BookSerializer(instance=self.get_queryset(),many=True)
		# 这里调用get_queryset是为了针对不同的model的业务逻辑只需要更改
		# 上面的queryset和serializer_class
		serializer = self.get_serializer(instance=self.get_queryset(), many=True)
		return Response(serializer.data)
	def post(self, request):
		''' serializer = BookSerializer(data=request.data)这句话相当于执行了
			serializer = self.get_serializer_class()(data=request.data)
			而get_serializer想当于执行了以上步骤
		'''
		serializer = self.get_serializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		else:
			return Response(serializer.errors)

class BookDetailView(GenericAPIView):
	queryset = Book.objects.all()
	serializer_class = BookSerializer
	''' 这里路由要这样写 re_path("sers/publish/(?P<pk>\d+)", BookDetailView.as_view())
		这里的也必须是pk因为源码里就是这也定义的
	'''
	def get(self, request, pk):  # 这里必须是pk
		serializer = self.get_serializer(instance=self.get_object(),many=False)
		return Response(serializer.data)
	def put(self, request, book_id):
		# 获取更新数据
		print("data",request.data)  # requset为API封装的request
		update_book = Book.objects.get(pk=book_id)  # 要更新的书
		# 下面这句话是不需要的因为写死了
		# serializer = BookSerializers(instance=update_book, data=request.data)
		serializer = self.get_serializer(instance=self.get_object(),data=request.data)
		if serializer.is_vaile():
			
			serializer.save() 
			return Response(serializer.data) 
		else:
			return Resopnse(serializer.errors)
	def delete(self, request, pk):
		self.get_object().delete()
		return Response()		
```

# DRF认证组件

用来验证用户的身份，比如是否登录、token 是否有效

## 自定义认证类

继承 `BaseAuthentication`，重写 `authenticate` 方法：

```python
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import UserToken

class MyAuth(BaseAuthentication):
    def authenticate(self, request):
        # 从请求头里拿 token
        token = request.query_params.get('token')
        if not token:
            raise AuthenticationFailed('缺少 token')
        user_token = UserToken.objects.filter(token=token).first()
        if not user_token:
            raise AuthenticationFailed('token 无效')
        # 必须返回 (user, auth) 元组，user 会赋值给 request.user
        return (user_token.user, token)

    def authenticate_header(self, request):
        return 'Bearer'
```

## 全局使用

在 settings.py 里配置，所有视图默认走这个认证：

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'app01.utils.MyAuth',
    ],
}
```

## 局部使用

在视图类里指定 `authentication_classes`：

```python
class BookView(APIView):
    authentication_classes = [MyAuth]

    def get(self, request):
        print(request.user)  # 认证通过后可以拿到用户
        return Response('ok')
```

不想认证的视图设为空列表即可：

```python
class LoginView(APIView):
    authentication_classes = []  # 登录接口不需要认证

    def post(self, request):
        ...
```

# DRF权限组件

认证通过后，还要判断用户有没有权限做某个操作，比如普通用户不能访问管理员接口

## 自定义权限类

继承 `BasePermission`，重写 `has_permission`：

```python
from rest_framework.permissions import BasePermission

class MyPermission(BasePermission):
    message = '只有VIP才能访问'

    def has_permission(self, request, view):
        # request.user 是认证组件赋值过来的
        if request.user.user_type == 'vip':
            return True
        return False
```

## 全局使用

```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'app01.utils.MyPermission',
    ],
}
```

## 局部使用

```python
class VipBookView(APIView):
    permission_classes = [MyPermission]

    def get(self, request):
        return Response('VIP 专属内容')
```

## 对象级别的权限

有时候不光要看用户类型，还要判断用户是不是资源的所有者，比如只能修改自己的文章：

```python
class IsOwner(BasePermission):
    message = '你不是作者，无权修改'

    def has_object_permission(self, request, view, obj):
        return obj.author == request.user
```

**认证和权限的执行顺序：** 先过认证（确定你是谁），再过权限（确定你能干什么）。两个组件配合使用，一个管身份，一个管授权。
